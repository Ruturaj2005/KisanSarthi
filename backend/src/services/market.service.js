const { MarketPrice, PriceAlert } = require('../models');
const logger = require('../utils/logger');

// ── MSP Data (2024-25) ─────────────────────────────────────────────
const MSP_DATA = {
  Rice: 2300, Wheat: 2275, Maize: 2090, Cotton: 7121,
  Soybean: 4892, Groundnut: 6377, Mustard: 5650,
  Chickpea: 5440, Bajra: 2500, Jowar: 3180,
  Sugarcane: 315,
  'Paddy(Common)': 2300, 'Soyabean': 4892,
  'Bengal Gram(Gram)(Whole)': 5440,
  'Arhar(Tur/Red Gram)(Whole)': 7000,
  'Lentil(Masur)(Whole)': 6425,
  'Green Gram(Moong)(Whole)': 8682,
  'Bajra(Pearl Millet/Cumbu)': 2500,
  Barley: 1850, 'Castor Seed': 6015,
};

// ── Commodity Aliases ──────────────────────────────────────────────
const COMMODITY_ALIASES = {
  'PADDY': 'Rice', 'DHAN': 'Rice', 'CHAWAL': 'Rice',
  'GEHUN': 'Wheat', 'GEHU': 'Wheat',
  'MAKKA': 'Maize', 'CORN': 'Maize',
  'KAPAS': 'Cotton', 'SOYABEAN': 'Soybean',
  'MOONGFALI': 'Groundnut', 'SARSON': 'Mustard',
  'CHANA': 'Chickpea', 'GANNA': 'Sugarcane',
  'PYAZ': 'Onion', 'ALOO': 'Potato', 'TAMATAR': 'Tomato',
};

// These are now used only as fallback; the real lists come from DB via getDistinctValues
const COMMODITIES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Onion',
  'Tomato', 'Potato', 'Mustard', 'Chickpea', 'Groundnut'];

const STATES = ['Maharashtra', 'Punjab', 'UP', 'MP', 'Rajasthan', 'AP', 'Karnataka', 'Gujarat'];

/**
 * Normalize commodity name using alias map.
 */
function normalizeCommodity(name) {
  const upper = (name || '').toUpperCase().trim();
  return COMMODITY_ALIASES[upper] || name;
}

// ── Dynamic Filter Helpers ────────────────────────────────────────

/**
 * Get distinct values for a field, optionally filtered.
 */
const getDistinctValues = async (field, filter = {}) => {
  const query = {};
  if (filter.state) query.state = filter.state;
  if (filter.district) query.district = filter.district;
  if (filter.commodity) query.commodity = filter.commodity;

  const values = await MarketPrice.distinct(field, query);
  return values.filter(Boolean).sort();
};

/**
 * Get all dynamic filter options in one call.
 */
const getFilterOptions = async (filter = {}) => {
  const states = await getDistinctValues('state', {});
  const districts = await getDistinctValues('district', { state: filter.state });
  const commodities = await getDistinctValues('commodity', {
    state: filter.state,
    district: filter.district,
  });

  return { states, districts, commodities };
};

// ── Core Price Functions ──────────────────────────────────────────

/**
 * Get latest market prices with optional filters.
 */
const getPrices = async ({ commodity, state, district, limit = 50 }) => {
  const query = {};
  if (commodity) query.commodity = commodity;
  if (state) query.state = state;
  if (district) query.district = district;

  const prices = await MarketPrice.find(query)
    .sort({ date: -1, modalPrice: -1 })
    .limit(limit)
    .lean();

  return prices.map((p) => ({
    ...p,
    msp: p.msp || MSP_DATA[p.commodity] || null,
    aboveMsp: MSP_DATA[p.commodity] ? p.modalPrice >= MSP_DATA[p.commodity] : null,
  }));
};

/**
 * Get price trend for a commodity at a specific mandi over N days.
 */
const getPriceTrend = async ({ commodity, mandi, days = 30 }) => {
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return MarketPrice.find({
    commodity,
    mandi,
    date: { $gte: fromDate },
  })
    .sort({ date: 1 })
    .lean();
};

// ── Analytics Functions ───────────────────────────────────────────

/**
 * Get best mandis for a commodity — sorted by highest modal price.
 * Helps farmers find WHERE TO SELL.
 */
const getBestMandis = async ({ commodity, state, limit = 10 }) => {
  const match = { commodity };
  if (state) match.state = state;

  const results = await MarketPrice.aggregate([
    { $match: match },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: { mandi: '$mandi', state: '$state', district: '$district' },
        modalPrice: { $first: '$modalPrice' },
        minPrice: { $first: '$minPrice' },
        maxPrice: { $first: '$maxPrice' },
        variety: { $first: '$variety' },
        grade: { $first: '$grade' },
        date: { $first: '$date' },
      },
    },
    { $sort: { modalPrice: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        mandi: '$_id.mandi',
        state: '$_id.state',
        district: '$_id.district',
        modalPrice: 1,
        minPrice: 1,
        maxPrice: 1,
        variety: 1,
        grade: 1,
        date: 1,
      },
    },
  ]);

  // Attach MSP
  const msp = MSP_DATA[commodity] || null;
  return results.map((r) => ({
    ...r,
    msp,
    aboveMsp: msp ? r.modalPrice >= msp : null,
  }));
};

/**
 * Get commodity price summary per state — aggregated stats.
 */
const getPriceSummary = async ({ state, limit = 20 }) => {
  const match = {};
  if (state) match.state = state;

  const results = await MarketPrice.aggregate([
    { $match: match },
    { $sort: { date: -1 } },
    {
      $group: {
        _id: '$commodity',
        avgPrice: { $avg: '$modalPrice' },
        minPrice: { $min: '$minPrice' },
        maxPrice: { $max: '$maxPrice' },
        mandiCount: { $addToSet: '$mandi' },
        latestDate: { $max: '$date' },
      },
    },
    { $sort: { avgPrice: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        commodity: '$_id',
        avgPrice: { $round: ['$avgPrice', 0] },
        minPrice: 1,
        maxPrice: 1,
        mandiCount: { $size: '$mandiCount' },
        latestDate: 1,
      },
    },
  ]);

  return results.map((r) => ({
    ...r,
    msp: MSP_DATA[r.commodity] || null,
    aboveMsp: MSP_DATA[r.commodity] ? r.avgPrice >= MSP_DATA[r.commodity] : null,
  }));
};

// ── Upsert & Alerts ──────────────────────────────────────────────

/**
 * Upsert market price record (used by cron job / import).
 */
const upsertPrice = async (priceData) => {
  const { commodity, mandi, date, ...rest } = priceData;
  return MarketPrice.findOneAndUpdate(
    { commodity, mandi, date },
    { $set: { commodity, mandi, date, ...rest, msp: MSP_DATA[commodity] || null } },
    { upsert: true, new: true }
  );
};

/**
 * Check price alerts after market data update.
 */
const checkPriceAlerts = async (commodity, mandi, modalPrice) => {
  const alerts = await PriceAlert.find({
    commodity,
    mandi,
    isActive: true,
    isTriggered: false,
  });

  const triggered = [];
  for (const alert of alerts) {
    const shouldTrigger =
      (alert.direction === 'above' && modalPrice >= alert.targetPrice) ||
      (alert.direction === 'below' && modalPrice <= alert.targetPrice);

    if (shouldTrigger) {
      alert.isTriggered = true;
      alert.triggeredAt = new Date();
      alert.triggeredPrice = modalPrice;
      await alert.save();
      triggered.push(alert);
      logger.info(`Price alert triggered for ${commodity}@${mandi}`, {
        service: 'market',
        meta: { alertId: alert._id, price: modalPrice, target: alert.targetPrice },
      });
    }
  }

  return triggered;
};

/**
 * Create a new price alert for a farmer.
 */
const createPriceAlert = async (farmerId, { commodity, mandi, targetPrice, direction }) => {
  return PriceAlert.create({ farmerId, commodity, mandi, targetPrice, direction });
};

/**
 * Delete a price alert.
 */
const deletePriceAlert = async (alertId, farmerId) => {
  return PriceAlert.findOneAndDelete({ _id: alertId, farmerId });
};

/**
 * Get farmer's price alerts.
 */
const getFarmerAlerts = async (farmerId) => {
  return PriceAlert.find({ farmerId }).sort({ createdAt: -1 }).lean();
};

module.exports = {
  getPrices,
  getPriceTrend,
  upsertPrice,
  checkPriceAlerts,
  createPriceAlert,
  deletePriceAlert,
  getFarmerAlerts,
  normalizeCommodity,
  getFilterOptions,
  getDistinctValues,
  getBestMandis,
  getPriceSummary,
  MSP_DATA,
  COMMODITIES,
  STATES,
};
