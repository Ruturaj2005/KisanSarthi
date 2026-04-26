const rateLimit = require('express-rate-limit');
const { getFarmerMessage } = require('../utils/farmerMessages');

/**
 * Rate limiter for auth routes: 5 requests per 15 minutes per IP.
 * Prevents brute-force OTP/password attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  trustProxy: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const lang = req.lang || 'en';
    res.status(429).json({
      success: false,
      error: getFarmerMessage('RATE_LIMITED', lang),
      code: 'RATE_LIMITED',
    });
  },
});

/**
 * General API rate limiter: 100 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  trustProxy: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const lang = req.lang || 'en';
    res.status(429).json({
      success: false,
      error: getFarmerMessage('RATE_LIMITED', lang),
      code: 'RATE_LIMITED',
    });
  },
});

module.exports = { authLimiter, apiLimiter };
