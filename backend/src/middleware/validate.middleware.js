const { z } = require('zod');
const { err } = require('../utils/apiResponse');

/**
 * Express middleware factory that validates request body against a Zod schema.
 * Returns farmer-friendly validation errors.
 *
 * @param {z.ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/register', validate(registerSchema), controller.register);
 */
const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      return err(res, messages.join('; '), 'VALIDATION_ERROR', 400);
    }
    return err(res, 'Validation failed', 'VALIDATION_ERROR', 400);
  }
};

/**
 * Validate query parameters against a Zod schema.
 */
const validateQuery = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.query);
    req.query = parsed;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      return err(res, messages.join('; '), 'VALIDATION_ERROR', 400);
    }
    return err(res, 'Validation failed', 'VALIDATION_ERROR', 400);
  }
};

module.exports = { validate, validateQuery };
