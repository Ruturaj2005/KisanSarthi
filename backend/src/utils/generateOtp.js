const crypto = require('crypto');

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt for uniform distribution (no modulo bias).
 *
 * @returns {string} 6-digit OTP string
 *
 * @example
 * generateOtp(); // → '482917'
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = generateOtp;
