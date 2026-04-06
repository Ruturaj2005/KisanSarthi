const { SoilTest } = require('../models');
const soilService = require('../services/soil.service');
const geminiService = require('../services/gemini.service');
const { ok, err } = require('../utils/apiResponse');

const createSoilTest = async (req, res, next) => {
  try {
    const { soilType, ph, nitrogen, phosphorus, potassium, moisture, crop } = req.body;

    // Compute health score (deterministic)
    const healthScore = soilService.computeHealthScore({ ph, nitrogen, phosphorus, potassium, moisture });

    // Get fertilizer recommendation
    const fertilizer = soilService.getFertilizerRecommendation(crop, { nitrogen, phosphorus, potassium });

    // Get pH correction
    const phFix = soilService.phCorrection(ph);

    // Get rotation suggestion
    const rotation = soilService.getRotationSuggestion(crop, { nitrogen, phosphorus, potassium });

    // Get AI explanation
    const lang = req.farmer?.preferredLang || 'hi';
    const soilData = { soilType, ph, nitrogen, phosphorus, potassium, moisture, healthScore, crop };
    let aiExplanation = '';
    try {
      const aiResult = await geminiService.getSoilExplanation(soilData, lang);
      aiExplanation = aiResult.explanation || '';
    } catch {
      aiExplanation = '';
    }

    // Save to DB
    const soilTest = await SoilTest.create({
      farmerId: req.farmerId,
      soilType, ph, nitrogen, phosphorus, potassium, moisture,
      healthScore, crop, aiExplanation,
    });

    return ok(res, {
      soilTest,
      healthScore,
      fertilizer,
      phCorrection: phFix,
      rotation,
      aiExplanation,
    }, 'Soil test saved', 201);
  } catch (error) {
    next(error);
  }
};

const getSoilTests = async (req, res, next) => {
  try {
    const tests = await SoilTest.find({ farmerId: req.farmerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return ok(res, { tests });
  } catch (error) {
    next(error);
  }
};

const getSoilRecommendation = async (req, res, next) => {
  try {
    const latestTest = await SoilTest.findOne({ farmerId: req.farmerId })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestTest) {
      return err(res, 'No soil test found. Please submit a soil test first.', 'NOT_FOUND', 404);
    }

    const fertilizer = soilService.getFertilizerRecommendation(
      latestTest.crop || req.query.crop || 'Rice',
      { nitrogen: latestTest.nitrogen, phosphorus: latestTest.phosphorus, potassium: latestTest.potassium }
    );
    const phFix = soilService.phCorrection(latestTest.ph);
    const rotation = soilService.getRotationSuggestion(
      latestTest.crop || 'Rice',
      { nitrogen: latestTest.nitrogen, phosphorus: latestTest.phosphorus, potassium: latestTest.potassium }
    );

    return ok(res, { latestTest, fertilizer, phCorrection: phFix, rotation });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSoilTest, getSoilTests, getSoilRecommendation };
