const { Advisory } = require('../models');
const { getAgriculturalAdvice } = require('../services/advisoryService');
const weatherService = require('../services/weather.service');
const { ok, err } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const HISTORY_LIMIT = 10;

const buildConversationHistory = (advisories = []) => {
  return advisories.flatMap((item) => {
    const messages = [];

    if (item.queryText) {
      messages.push({ role: 'user', content: item.queryText });
    }

    if (item.aiResponse) {
      messages.push({ role: 'assistant', content: item.aiResponse });
    }

    return messages;
  });
};

const chat = async (req, res, next) => {
  try {
    const { query, type = 'general' } = req.body;
    const farmer = req.farmer;

    // Build context from farmer profile
    const context = {
      state: farmer.location?.state || '',
      district: farmer.location?.district || '',
      soilType: farmer.soilType || '',
      ph: 6.5, // Default — would come from latest soil test
      crop: farmer.primaryCrops?.[0] || '',
      daysGrown: 30, // Default
      weather: { condition: 'Clear', temp: 30, humidity: 60 },
      lastTwoSeasons: farmer.primaryCrops?.slice(0, 2) || [],
    };

    // Try to get current weather for richer context
    if (farmer.location?.lat && farmer.location?.lng) {
      try {
        const weather = await weatherService.getCurrentWeather(farmer.location.lat, farmer.location.lng);
        if (weather) {
          context.weather = weather;
        }
      } catch (weatherErr) {
        // Non-critical — continue with default weather
      }
    }

    const lang = farmer.preferredLang || 'hi';

    // Rebuild prior conversation from previous advisory turns.
    const recentAdvisories = await Advisory.find({ farmerId: farmer._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT)
      .select('queryText aiResponse')
      .lean();

    const conversationHistory = buildConversationHistory(recentAdvisories.reverse());
    const adviceText = await getAgriculturalAdvice(query, conversationHistory);

    const aiResult = {
      advice: adviceText,
      steps: [],
      urgency: 'low',
      confidence: 0.7,
      sources: ['Hugging Face Inference API'],
      warnings: [],
    };

    // Save advisory
    const advisory = await Advisory.create({
      farmerId: farmer._id,
      type,
      queryText: query,
      contextSnapshot: context,
      aiResponse: aiResult.advice,
      steps: aiResult.steps,
      urgency: aiResult.urgency,
      confidence: aiResult.confidence,
      language: lang,
    });

    return ok(res, {
      advisory: {
        _id: advisory._id,
        advice: aiResult.advice,
        steps: aiResult.steps,
        urgency: aiResult.urgency,
        confidence: aiResult.confidence,
        sources: aiResult.sources,
        warnings: aiResult.warnings,
      },
    });
  } catch (error) {
    logger.error('Advisory chat failed', {
      service: 'advisory-controller',
      meta: { error: error.message, stack: error.stack },
    });

    const message = (error?.message || '').toLowerCase();

    if (message.includes('loading')) {
      return err(res, 'Model is warming up, please try again in 30 seconds', 'MODEL_LOADING', 503);
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return err(res, 'Too many requests', 'RATE_LIMITED', 429);
    }

    return err(res, 'Internal server error', 'INTERNAL_ERROR', 500);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [advisories, total] = await Promise.all([
      Advisory.find({ farmerId: req.farmerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Advisory.countDocuments({ farmerId: req.farmerId }),
    ]);

    return ok(res, {
      advisories,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const { advisoryId, rating, comment } = req.body;
    const advisory = await Advisory.findOneAndUpdate(
      { _id: advisoryId, farmerId: req.farmerId },
      { $set: { rating, feedbackComment: comment || '' } },
      { new: true }
    );
    if (!advisory) {
      return err(res, 'Advisory not found', 'NOT_FOUND', 404);
    }
    return ok(res, { advisory }, 'Feedback submitted');
  } catch (error) {
    next(error);
  }
};

module.exports = { chat, getHistory, submitFeedback };
