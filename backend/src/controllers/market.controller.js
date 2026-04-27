const marketService = require('../services/market.service');
const agmarknetService = require('../services/agmarknet.service');
const logger = require('../utils/logger');
const { ok, err } = require('../utils/apiResponse');

/**
 * GET /market/prices
 * Primary: AGMARKNET API → Fallback: MongoDB
 */
const getPrices = async (req, res, next) => {
  try {
    const { commodity, state, district, limit } = req.query;
    const parsedLimit = parseInt(limit) || 100;

    try {
      // Try AGMARKNET API first
      const { records, total } = await agmarknetService.fetchPrices({
        state,
        district,
        commodity,
        limit: parsedLimit,
      });

      // Attach MSP data to each record
      const prices = records.map((p) => ({
        ...p,
        msp: marketService.MSP_DATA[p.commodity] || null,
        aboveMsp: marketService.MSP_DATA[p.commodity]
          ? p.modalPrice >= marketService.MSP_DATA[p.commodity]
          : null,
      }));

      return ok(res, {
        prices,
        total,
        source: 'agmarknet',
        commodities: marketService.COMMODITIES,
        states: marketService.STATES,
      });
    } catch (apiError) {
      // Fallback to MongoDB
      logger.warn('AGMARKNET API failed, falling back to MongoDB', {
        service: 'market',
        meta: { error: apiError.message },
      });

      const prices = await marketService.getPrices({
        commodity,
        state,
        district,
        limit: parsedLimit,
      });

      return ok(res, {
        prices,
        source: 'database',
        stale: true,
        commodities: marketService.COMMODITIES,
        states: marketService.STATES,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /market/trend
 * Always uses MongoDB (needs historical data the live API doesn't provide).
 * The AGMARKNET API only returns current-day prices, so trend data is
 * accumulated over time via the daily cron sync.
 */
const getTrend = async (req, res, next) => {
  try {
    const { commodity, mandi, days } = req.query;
    if (!commodity || !mandi) {
      return err(res, 'commodity and mandi are required', 'VALIDATION_ERROR', 400);
    }
    const trend = await marketService.getPriceTrend({
      commodity, mandi, days: parseInt(days) || 30,
    });
    const msp = marketService.MSP_DATA[commodity] || null;

    // Count unique dates to give the frontend context
    const uniqueDates = new Set(trend.map((t) => new Date(t.date).toDateString()));
    const message = uniqueDates.size < 2
      ? 'Trend data builds up over time as daily prices are synced. Check back in a few days for a complete trend chart.'
      : null;

    return ok(res, { trend, msp, message, dataPoints: uniqueDates.size });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /market/sync
 * Manually trigger an AGMARKNET data sync into MongoDB.
 * Useful for seeding historical data for trend charts.
 */
const syncNow = async (req, res, next) => {
  try {
    const { syncMarketDataNow } = require('../services/cron.service');
    const upserted = await syncMarketDataNow();
    return ok(res, { upserted }, 'Market data synced from AGMARKNET');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /market/filters
 * Primary: AGMARKNET API → Fallback: MongoDB
 */
const getFilters = async (req, res, next) => {
  try {
    const { state, district } = req.query;

    try {
      const filters = await agmarknetService.fetchFilters({ state, district });
      return ok(res, filters);
    } catch (apiError) {
      logger.warn('AGMARKNET filters failed, falling back to MongoDB', {
        service: 'market',
        meta: { error: apiError.message },
      });
      const filters = await marketService.getFilterOptions({ state, district });
      return ok(res, filters);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /market/best-mandis
 * Primary: AGMARKNET API → Fallback: MongoDB
 */
const getBestMandis = async (req, res, next) => {
  try {
    const { commodity, state, limit } = req.query;
    if (!commodity) {
      return err(res, 'commodity is required', 'VALIDATION_ERROR', 400);
    }
    const parsedLimit = parseInt(limit) || 10;

    try {
      // Fetch from AGMARKNET, filter for the commodity, dedupe by mandi, sort by price
      const { records } = await agmarknetService.fetchPrices({
        commodity,
        state,
        limit: 500,
      });

      // Deduplicate by mandi — keep the one with highest modal price
      const mandiMap = new Map();
      for (const r of records) {
        const key = r.mandi;
        if (!mandiMap.has(key) || r.modalPrice > mandiMap.get(key).modalPrice) {
          mandiMap.set(key, r);
        }
      }

      const msp = marketService.MSP_DATA[commodity] || null;
      const mandis = [...mandiMap.values()]
        .sort((a, b) => b.modalPrice - a.modalPrice)
        .slice(0, parsedLimit)
        .map((m) => ({
          ...m,
          msp,
          aboveMsp: msp ? m.modalPrice >= msp : null,
        }));

      return ok(res, { mandis, msp });
    } catch (apiError) {
      logger.warn('AGMARKNET best-mandis failed, falling back to MongoDB', {
        service: 'market',
        meta: { error: apiError.message },
      });
      const mandis = await marketService.getBestMandis({
        commodity, state, limit: parsedLimit,
      });
      const msp = marketService.MSP_DATA[commodity] || null;
      return ok(res, { mandis, msp });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /market/summary
 * Primary: AGMARKNET API (in-memory aggregation) → Fallback: MongoDB
 */
const getSummary = async (req, res, next) => {
  try {
    const { state, limit } = req.query;
    const parsedLimit = parseInt(limit) || 20;

    try {
      const { records } = await agmarknetService.fetchPrices({
        state,
        limit: 500,
      });

      // Aggregate in-memory: group by commodity
      const commodityMap = new Map();
      for (const r of records) {
        if (!commodityMap.has(r.commodity)) {
          commodityMap.set(r.commodity, {
            commodity: r.commodity,
            prices: [],
            mandis: new Set(),
            minPrice: Infinity,
            maxPrice: -Infinity,
          });
        }
        const entry = commodityMap.get(r.commodity);
        entry.prices.push(r.modalPrice);
        entry.mandis.add(r.mandi);
        if (r.minPrice < entry.minPrice) entry.minPrice = r.minPrice;
        if (r.maxPrice > entry.maxPrice) entry.maxPrice = r.maxPrice;
      }

      const summary = [...commodityMap.values()]
        .map((entry) => {
          const avgPrice = Math.round(
            entry.prices.reduce((sum, p) => sum + p, 0) / entry.prices.length
          );
          const msp = marketService.MSP_DATA[entry.commodity] || null;
          return {
            commodity: entry.commodity,
            avgPrice,
            minPrice: entry.minPrice,
            maxPrice: entry.maxPrice,
            mandiCount: entry.mandis.size,
            msp,
            aboveMsp: msp ? avgPrice >= msp : null,
          };
        })
        .sort((a, b) => b.avgPrice - a.avgPrice)
        .slice(0, parsedLimit);

      return ok(res, { summary, source: 'agmarknet' });
    } catch (apiError) {
      logger.warn('AGMARKNET summary failed, falling back to MongoDB', {
        service: 'market',
        meta: { error: apiError.message },
      });
      const summary = await marketService.getPriceSummary({
        state, limit: parsedLimit,
      });
      return ok(res, { summary, source: 'database' });
    }
  } catch (error) {
    next(error);
  }
};

const createAlert = async (req, res, next) => {
  try {
    const alert = await marketService.createPriceAlert(req.farmerId, req.body);
    return ok(res, { alert }, 'Price alert created', 201);
  } catch (error) {
    next(error);
  }
};

const deleteAlert = async (req, res, next) => {
  try {
    const alert = await marketService.deletePriceAlert(req.params.id, req.farmerId);
    if (!alert) {
      return err(res, 'Alert not found', 'NOT_FOUND', 404);
    }
    return ok(res, null, 'Alert deleted');
  } catch (error) {
    next(error);
  }
};

const getMyAlerts = async (req, res, next) => {
  try {
    const alerts = await marketService.getFarmerAlerts(req.farmerId);
    return ok(res, { alerts });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPrices, getTrend, getFilters, getBestMandis, getSummary, createAlert, deleteAlert, getMyAlerts, syncNow };
