const logger = require('../utils/logger');
const { err } = require('../utils/apiResponse');
const { getFarmerMessage } = require('../utils/farmerMessages');

/**
 * Global error handler middleware.
 * Catches all unhandled errors, logs them, and returns farmer-friendly messages.
 * Never exposes internal error details in production.
 */
const errorHandler = (error, req, res, _next) => {
  const lang = req.lang || req.farmer?.preferredLang || 'en';

  logger.error(error.message, {
    service: 'error-handler',
    meta: {
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    },
  });

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((e) => e.message);
    return err(res, messages.join('; '), 'VALIDATION_ERROR', 400);
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue).join(', ');
    return err(res, `Duplicate value for: ${field}`, 'DUPLICATE_ERROR', 409);
  }

  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return err(res, 'Invalid ID format', 'INVALID_ID', 400);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return err(res, getFarmerMessage('UNAUTHORIZED', lang), 'UNAUTHORIZED', 401);
  }

  if (error.name === 'TokenExpiredError') {
    return err(res, getFarmerMessage('SESSION_EXPIRED', lang), 'SESSION_EXPIRED', 401);
  }

  // Multer errors
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return err(res, 'File too large. Maximum size is 5MB.', 'FILE_TOO_LARGE', 400);
    }
    return err(res, error.message, 'UPLOAD_ERROR', 400);
  }

  // Default
  const message = process.env.NODE_ENV === 'production'
    ? getFarmerMessage('SERVER_ERROR', lang)
    : error.message;

  return err(res, message, 'INTERNAL_ERROR', error.status || 500);
};

module.exports = errorHandler;
