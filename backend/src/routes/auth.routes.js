const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { verifyToken } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const idempotency = require('../middleware/idempotency.middleware');
const {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  resendOtpSchema,
  completeProfileSchema,
} = require('../validators/auth.validator');

// POST /api/auth/register
router.post('/register', authLimiter, idempotency, validate(registerSchema), authController.register);

// POST /api/auth/verify-otp
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// POST /api/auth/resend-otp
router.post('/resend-otp', authLimiter, idempotency, validate(resendOtpSchema), authController.resendOtp);

// POST /api/auth/refresh
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', verifyToken, authController.logout);

// POST /api/auth/complete-profile
router.post('/complete-profile', verifyToken, validate(completeProfileSchema), authController.completeProfile);

module.exports = router;
