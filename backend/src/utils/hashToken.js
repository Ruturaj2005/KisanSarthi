const crypto = require('crypto');

/**
 * Hash a token using SHA-256.
 * Used for hashing refresh tokens before DB storage, and
 * for hashing location coordinates before analytics logging.
 *
 * @param {string} token - The plaintext token to hash
 * @returns {string} SHA-256 hex digest
 *
 * @example
 * hashToken('my-refresh-token'); // → '5e884898da2804...'
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = hashToken;
