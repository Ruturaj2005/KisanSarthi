const { PestDetection } = require('../models');
const cloudinaryService = require('../services/cloudinary.service');
const geminiService = require('../services/gemini.service');
const { ok, err } = require('../utils/apiResponse');
const env = require('../config/env');
const logger = require('../utils/logger');

const detect = async (req, res, next) => {
  try {
    const { cropType } = req.body;
    if (!req.file) {
      return err(res, 'Image is required', 'VALIDATION_ERROR', 400);
    }

    // Upload to Cloudinary
    let imageUrl = '';
    let publicId = '';
    try {
      const upload = await cloudinaryService.uploadImage(req.file.buffer, 'pest-scans');
      imageUrl = upload.url;
      publicId = upload.publicId;
    } catch {
      logger.warn('Cloudinary upload failed, continuing without image storage', { service: 'pest' });
    }

    // Call ML service for prediction
    let mlResult = null;
    try {
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append('image', blob, 'image.jpg');
      formData.append('cropType', cropType || 'Unknown');

      const mlResponse = await fetch(`${env.ML_SERVICE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (mlResponse.ok) {
        mlResult = await mlResponse.json();
      }
    } catch (error) {
      logger.warn('ML service unavailable', { service: 'pest', meta: { error: error.message } });
    }

    let disease = 'Unknown';
    let confidence = 0;
    let severity = 'low';
    let treatment = [];
    let organic = [];
    let chemical = [];
    let geminiVerified = false;

    if (mlResult && mlResult.prediction) {
      disease = mlResult.prediction.label || 'Unknown';
      confidence = mlResult.prediction.confidence || 0;

      // If low confidence, use Gemini to verify
      if (confidence < 0.70 && mlResult.top3) {
        try {
          const lang = req.farmer?.preferredLang || 'hi';
          const geminiResult = await geminiService.verifyPestDetection(mlResult.top3, cropType, lang);
          disease = geminiResult.disease;
          confidence = geminiResult.confidence;
          severity = geminiResult.severity;
          treatment = geminiResult.treatment;
          organic = geminiResult.organic;
          chemical = geminiResult.chemical;
          geminiVerified = true;
        } catch {
          logger.warn('Gemini pest verification failed', { service: 'pest' });
        }
      }
    } else {
      // ML service unavailable — use Gemini directly with placeholder
      try {
        const lang = req.farmer?.preferredLang || 'hi';
        const geminiResult = await geminiService.verifyPestDetection(
          [{ label: 'Unable to identify — image analysis pending', confidence: 0 }],
          cropType || 'Unknown',
          lang
        );
        disease = geminiResult.disease;
        severity = geminiResult.severity;
        treatment = geminiResult.treatment;
        organic = geminiResult.organic;
        chemical = geminiResult.chemical;
        geminiVerified = true;
      } catch {
        // Both services failed
      }
    }

    // Determine severity from confidence if not set by Gemini
    if (!geminiVerified) {
      if (confidence >= 0.9) severity = 'high';
      else if (confidence >= 0.7) severity = 'medium';
      else severity = 'low';
    }

    // Save detection
    const detection = await PestDetection.create({
      farmerId: req.farmerId,
      cropType: cropType || '',
      imageUrl,
      publicId,
      disease,
      confidence,
      severity,
      treatment,
      organic,
      chemical,
      geminiVerified,
    });

    return ok(res, { detection }, 'Pest detection complete', 201);
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const detections = await PestDetection.find({ farmerId: req.farmerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return ok(res, { detections });
  } catch (error) {
    next(error);
  }
};

const getDetection = async (req, res, next) => {
  try {
    const detection = await PestDetection.findOne({
      _id: req.params.id,
      farmerId: req.farmerId,
    }).lean();
    if (!detection) {
      return err(res, 'Detection not found', 'NOT_FOUND', 404);
    }
    return ok(res, { detection });
  } catch (error) {
    next(error);
  }
};

module.exports = { detect, getHistory, getDetection };
