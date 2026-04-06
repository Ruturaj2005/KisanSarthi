const { LRUCache } = require('lru-cache');
const env = require('../config/env');

const cache = new LRUCache({
  max: 1000,
  ttl: env.IDEMPOTENCY_TTL_MS,
});

/**
 * Idempotency middleware for POST routes that trigger external calls.
 * Deduplicates requests within a 30-second window using X-Idempotency-Key header.
 *
 * If the same key is seen again within TTL, returns the cached response.
 */
const idempotency = (req, res, next) => {
  const key = req.headers['x-idempotency-key'];
  if (!key) {
    return next();
  }

  const cached = cache.get(key);
  if (cached) {
    return res.status(cached.status).json(cached.body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    cache.set(key, { status: res.statusCode, body });
    return originalJson(body);
  };

  next();
};

module.exports = idempotency;
