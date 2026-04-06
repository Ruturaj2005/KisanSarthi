const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Farmer } = require('../models');
const env = require('../config/env');
const generateOtp = require('../utils/generateOtp');
const hashToken = require('../utils/hashToken');
const { sendOtpEmail } = require('./mailer.service');
const logger = require('../utils/logger');

/**
 * Register a new farmer. Generates OTP, hashes it, sends email.
 * Anti-enumeration: always returns OTP_SENT regardless of email existence.
 *
 * @param {{ name: string, email: string, password?: string }} data
 * @returns {Promise<{ message: string }>}
 */
const register = async ({ name, email, password }) => {
  const existing = await Farmer.findOne({ email }).lean();
  if (existing && existing.isVerified) {
    throw Object.assign(new Error('Email already registered'), { code: 'EMAIL_EXISTS', status: 409 });
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  if (existing && !existing.isVerified) {
    // Re-registration attempt — update OTP
    await Farmer.findByIdAndUpdate(existing._id, {
      name,
      otp: hashedOtp,
      otpExpiresAt,
      ...(password && { passwordHash: await bcrypt.hash(password, 10) }),
    });
  } else {
    // New farmer
    await Farmer.create({
      name,
      email,
      otp: hashedOtp,
      otpExpiresAt,
      ...(password && { passwordHash: await bcrypt.hash(password, 10) }),
    });
  }

  // Log OTP in dev for testing (never in production)
  if (env.NODE_ENV === 'development') {
    logger.info(`[DEV] OTP for ${email}: ${otp}`, { service: 'auth' });
  }

  await sendOtpEmail(email, otp, name);
  return { message: 'OTP_SENT' };
};

/**
 * Verify OTP and issue JWT tokens.
 *
 * @param {{ email: string, otp: string }} data
 * @returns {Promise<{ accessToken: string, refreshToken: string, farmer: object }>}
 */
const verifyOtp = async ({ email, otp }) => {
  const farmer = await Farmer.findOne({ email });
  if (!farmer) {
    throw Object.assign(new Error('Invalid OTP'), { code: 'INVALID_OTP', status: 400 });
  }

  if (farmer.isVerified) {
    throw Object.assign(new Error('Already verified'), { code: 'ALREADY_VERIFIED', status: 400 });
  }

  if (!farmer.otp || !farmer.otpExpiresAt) {
    throw Object.assign(new Error('No OTP found'), { code: 'INVALID_OTP', status: 400 });
  }

  if (farmer.otpExpiresAt < new Date()) {
    throw Object.assign(new Error('OTP expired'), { code: 'OTP_EXPIRED', status: 400 });
  }

  const isMatch = await bcrypt.compare(otp, farmer.otp);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid OTP'), { code: 'INVALID_OTP', status: 400 });
  }

  // Mark verified, clear OTP
  farmer.isVerified = true;
  farmer.otp = null;
  farmer.otpExpiresAt = null;

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(farmer._id);
  farmer.refreshToken = hashToken(refreshToken);
  await farmer.save();

  return {
    accessToken,
    refreshToken,
    farmer: farmer.toSafeObject(),
  };
};

/**
 * Login with email + password or email + OTP.
 */
const login = async ({ email, password, otp }) => {
  const farmer = await Farmer.findOne({ email });
  if (!farmer) {
    throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS', status: 401 });
  }

  if (!farmer.isVerified) {
    throw Object.assign(new Error('Not verified'), { code: 'NOT_VERIFIED', status: 403 });
  }

  // OTP-based login
  if (otp) {
    if (!farmer.otp || farmer.otpExpiresAt < new Date()) {
      throw Object.assign(new Error('Invalid or expired OTP'), { code: 'INVALID_OTP', status: 400 });
    }
    const isMatch = await bcrypt.compare(otp, farmer.otp);
    if (!isMatch) {
      throw Object.assign(new Error('Invalid OTP'), { code: 'INVALID_OTP', status: 400 });
    }
    farmer.otp = null;
    farmer.otpExpiresAt = null;
  }
  // Password-based login
  else if (password) {
    if (!farmer.passwordHash) {
      throw Object.assign(new Error('No password set'), { code: 'INVALID_CREDENTIALS', status: 401 });
    }
    const isMatch = await bcrypt.compare(password, farmer.passwordHash);
    if (!isMatch) {
      throw Object.assign(new Error('Invalid credentials'), { code: 'INVALID_CREDENTIALS', status: 401 });
    }
  } else {
    throw Object.assign(new Error('Provide password or OTP'), { code: 'INVALID_CREDENTIALS', status: 400 });
  }

  const { accessToken, refreshToken } = generateTokens(farmer._id);
  farmer.refreshToken = hashToken(refreshToken);
  await farmer.save();

  return {
    accessToken,
    refreshToken,
    farmer: farmer.toSafeObject(),
  };
};

/**
 * Resend OTP for unverified accounts or for OTP login.
 */
const resendOtp = async ({ email }) => {
  const farmer = await Farmer.findOne({ email });
  if (!farmer) {
    // Anti-enumeration: always return success
    return { message: 'OTP_SENT' };
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  farmer.otp = hashedOtp;
  farmer.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await farmer.save();

  if (env.NODE_ENV === 'development') {
    logger.info(`[DEV] OTP for ${email}: ${otp}`, { service: 'auth' });
  }

  await sendOtpEmail(email, otp, farmer.name);
  return { message: 'OTP_SENT' };
};

/**
 * Refresh access token using refresh token from cookie.
 */
const refreshAccessToken = async (refreshTokenPlain) => {
  if (!refreshTokenPlain) {
    throw Object.assign(new Error('No refresh token'), { code: 'UNAUTHORIZED', status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenPlain, env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { code: 'SESSION_EXPIRED', status: 401 });
  }

  const farmer = await Farmer.findById(decoded.id);
  if (!farmer) {
    throw Object.assign(new Error('Farmer not found'), { code: 'UNAUTHORIZED', status: 401 });
  }

  const hashed = hashToken(refreshTokenPlain);
  if (farmer.refreshToken !== hashed) {
    throw Object.assign(new Error('Token mismatch'), { code: 'UNAUTHORIZED', status: 401 });
  }

  const accessToken = jwt.sign({ id: farmer._id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { accessToken, farmer: farmer.toSafeObject() };
};

/**
 * Logout — clear refresh token from DB and cookie.
 */
const logout = async (farmerId) => {
  await Farmer.findByIdAndUpdate(farmerId, { refreshToken: null });
  return { message: 'LOGGED_OUT' };
};

/**
 * Complete farmer profile after OTP verification.
 */
const completeProfile = async (farmerId, profileData) => {
  const farmer = await Farmer.findByIdAndUpdate(
    farmerId,
    { $set: profileData },
    { new: true, runValidators: true }
  );
  if (!farmer) {
    throw Object.assign(new Error('Farmer not found'), { code: 'NOT_FOUND', status: 404 });
  }
  return farmer.toSafeObject();
};

// ── Helpers ──────────────────────────────────────────────────────

function generateTokens(farmerId) {
  const accessToken = jwt.sign({ id: farmerId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: farmerId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

module.exports = {
  register,
  verifyOtp,
  login,
  resendOtp,
  refreshAccessToken,
  logout,
  completeProfile,
};
