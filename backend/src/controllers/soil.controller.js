const { SoilTest } = require('../models');
const soilService = require('../services/soil.service');
const geminiService = require('../services/gemini.service');
const { ok, err } = require('../utils/apiResponse');

const createSoilTest = async (req, res, next) => {
  try {
    const {
      soilType, ph, nitrogen, phosphorus, potassium, moisture, crop,
      nitrogenValue, phosphorusValue, potassiumValue,
      organicCarbon, ec, zinc, iron, boron, manganese,
      inputMode,
    } = req.body;

    // If advanced mode, compute categories from numeric values
    const nCat = nitrogenValue != null ? soilService.categorizeNutrient(nitrogenValue, 'nitrogen') : nitrogen;
    const pCat = phosphorusValue != null ? soilService.categorizeNutrient(phosphorusValue, 'phosphorus') : phosphorus;
    const kCat = potassiumValue != null ? soilService.categorizeNutrient(potassiumValue, 'potassium') : potassium;

    const soilData = {
      soilType, ph,
      nitrogen: nCat, phosphorus: pCat, potassium: kCat, moisture,
      nitrogenValue, phosphorusValue, potassiumValue,
      organicCarbon, ec, zinc, iron, boron, manganese,
    };

    // Compute health score
    const healthScore = soilService.computeHealthScore(soilData);

    // Radar chart data
    const radarData = soilService.computeNutrientRadar(soilData);

    // Fertilizer schedule (split doses)
    const schedule = soilService.getFertilizerSchedule(crop, soilData);

    // Simple fertilizer totals (legacy compatibility)
    const fertilizer = schedule.totalPerAcre;
    fertilizer.note = schedule.note;

    // pH correction
    const phFix = soilService.phCorrection(ph);

    // Rotation suggestion
    const rotation = soilService.getRotationSuggestion(crop, soilData);

    // Deficiency alerts
    const deficiencies = soilService.getDeficiencies(soilData, crop);

    // Organic alternatives
    const organicOptions = soilService.getOrganicAlternatives(soilData);

    // Soil improvement action plan
    const improvementPlan = soilService.getSoilImprovementPlan(soilData, crop);

    // AI explanation
    const lang = req.farmer?.preferredLang || 'hi';
    const aiSoilData = { soilType, ph, nitrogen: nCat, phosphorus: pCat, potassium: kCat, moisture, healthScore, crop };
    let aiExplanation = '';
    try {
      const aiResult = await geminiService.getSoilExplanation(aiSoilData, lang);
      aiExplanation = aiResult.explanation || '';
    } catch {
      aiExplanation = '';
    }

    // Save to DB
    const soilTest = await SoilTest.create({
      farmerId: req.farmerId,
      soilType, ph,
      nitrogen: nCat, phosphorus: pCat, potassium: kCat, moisture,
      nitrogenValue, phosphorusValue, potassiumValue,
      organicCarbon, ec, zinc, iron, boron, manganese,
      healthScore, crop, inputMode: inputMode || 'quick', aiExplanation,
    });

    return ok(res, {
      soilTest,
      healthScore,
      radarData,
      fertilizer,
      fertilizerSchedule: schedule.schedule,
      phCorrection: phFix,
      rotation,
      deficiencies,
      organicOptions,
      improvementPlan,
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

const getTestHistory = async (req, res, next) => {
  try {
    const tests = await SoilTest.find({ farmerId: req.farmerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('healthScore createdAt crop soilType ph nitrogen phosphorus potassium organicCarbon')
      .lean();

    const trend = tests.reverse().map((t) => ({
      date: t.createdAt,
      score: t.healthScore,
      crop: t.crop,
    }));

    return ok(res, { tests, trend });
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

    const crop = req.query.crop || latestTest.crop || 'Rice';
    const schedule = soilService.getFertilizerSchedule(crop, latestTest);
    const phFix = soilService.phCorrection(latestTest.ph);
    const rotation = soilService.getRotationSuggestion(crop, latestTest);
    const deficiencies = soilService.getDeficiencies(latestTest, crop);
    const organicOptions = soilService.getOrganicAlternatives(latestTest);

    return ok(res, {
      latestTest,
      fertilizer: { ...schedule.totalPerAcre, note: schedule.note },
      fertilizerSchedule: schedule.schedule,
      phCorrection: phFix,
      rotation,
      deficiencies,
      organicOptions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createSoilTest, getSoilTests, getTestHistory, getSoilRecommendation };
