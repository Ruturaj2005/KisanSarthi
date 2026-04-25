const { PestDetection } = require('../models');
const cloudinaryService = require('../services/cloudinary.service');
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

    if (mlResult && mlResult.prediction) {
      disease = mlResult.prediction.label || 'Unknown';
      confidence = mlResult.prediction.confidence || 0;
      
      // Determine severity from confidence
      if (confidence >= 0.9) severity = 'high';
      else if (confidence >= 0.75) severity = 'medium';
      else severity = 'low';

      // Provide basic treatment suggestions based on disease
      if (disease.toLowerCase().includes('healthy')) {
        treatment = ['Continue regular monitoring', 'Maintain crop health', 'Follow standard practices'];
        organic = ['Regular crop rotation', 'Proper drainage management'];
        chemical = [];
      } else {
        treatment = ['Isolate affected plants if possible', 'Monitor spread', 'Consult local agricultural officer'];
        organic = ['Use neem oil or organic pesticides', 'Increase spacing between plants for air circulation'];
        chemical = ['Consult agricultural officer for chemical recommendations'];
      }
    } else {
      // ML service unavailable
      logger.warn('ML service unavailable, returning error', { service: 'pest' });
      return err(res, 'Disease detection service unavailable. Please try again.', 'SERVICE_UNAVAILABLE', 503);
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
      geminiVerified: false,
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
