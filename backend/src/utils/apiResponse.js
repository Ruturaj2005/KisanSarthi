/**
 * Standardized API response helpers.
 * Every API response follows { success, data?, message?, error?, code? } shape.
 *
 * @example
 * ok(res, { farmer: { name: 'Ramesh' } }, 'Profile loaded');
 * // → { success: true, data: { farmer: { name: 'Ramesh' } }, message: 'Profile loaded' }
 *
 * @example
 * err(res, 'Invalid OTP', 'INVALID_OTP', 400);
 * // → { success: false, error: 'Invalid OTP', code: 'INVALID_OTP' }
 */

const ok = (res, data = null, message = '', status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    message,
  });
};

const err = (res, message = 'Internal server error', code = 'INTERNAL_ERROR', status = 500) => {
  return res.status(status).json({
    success: false,
    error: message,
    code,
  });
};

const paginated = (res, data, total, page, limit, message = '') => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message,
  });
};

module.exports = { ok, err, paginated };
