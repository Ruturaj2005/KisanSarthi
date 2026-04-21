const authService = require('../services/auth.service');
const { ok, err } = require('../utils/apiResponse');
const { getFarmerMessage } = require('../utils/farmerMessages');
const env = require('../config/env');
const logger = require('../utils/logger');
const { notifySingleLoggedInFarmerForAllSchemes } = require('../services/scheme.service');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

const CLEAR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return ok(res, result, 'OTP sent to your email', 201);
  } catch (error) {
    if (error.code === 'EMAIL_EXISTS') {
      return err(res, getFarmerMessage('EMAIL_EXISTS', req.body.preferredLang || 'en'), error.code, error.status);
    }
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    notifySingleLoggedInFarmerForAllSchemes(result.farmer._id)
      .catch((notifyError) => {
        logger.error('Failed to trigger scheme WhatsApp notifications after OTP verify', {
          service: 'auth',
          meta: { farmerId: result.farmer._id, error: notifyError.message },
        });
      });

    return ok(res, {
      accessToken: result.accessToken,
      farmer: result.farmer,
    }, 'Email verified successfully');
  } catch (error) {
    if (error.code) {
      return err(res, getFarmerMessage(error.code, 'en'), error.code, error.status);
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    notifySingleLoggedInFarmerForAllSchemes(result.farmer._id)
      .catch((notifyError) => {
        logger.error('Failed to trigger scheme WhatsApp notifications after login', {
          service: 'auth',
          meta: { farmerId: result.farmer._id, error: notifyError.message },
        });
      });

    return ok(res, {
      accessToken: result.accessToken,
      farmer: result.farmer,
    }, 'Login successful');
  } catch (error) {
    if (error.code) {
      return err(res, getFarmerMessage(error.code, 'en'), error.code, error.status);
    }
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const result = await authService.resendOtp(req.body);
    return ok(res, result, 'OTP sent');
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const result = await authService.refreshAccessToken(refreshToken);
    return ok(res, result, 'Token refreshed');
  } catch (error) {
    if (error.code) {
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      return err(res, getFarmerMessage(error.code, 'en'), error.code, error.status);
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.farmer._id);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return ok(res, null, 'Logged out');
  } catch (error) {
    next(error);
  }
};

const completeProfile = async (req, res, next) => {
  try {
    const farmer = await authService.completeProfile(req.farmer._id, req.body);
    return ok(res, { farmer }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOtp,
  login,
  resendOtp,
  refresh,
  logout,
  completeProfile,
};
