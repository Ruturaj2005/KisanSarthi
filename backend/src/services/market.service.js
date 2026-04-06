const { MarketPrice, PriceAlert } = require('../models');
const logger = require('../utils/logger');

// ── MSP Data (2024-25) ─────────────────────────────────────────────
const MSP_DATA = {
  Rice: 2300, Wheat: 2275, Maize: 2090, Cotton: 7121,
  Soybean: 4892, Groundnut: 6377, Mustard: 5650,
  Chickpea: 5440, Bajra: 2500, Jowar: 3180,
  Sugarcane: 315, // per quintal (different unit)
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

/**
 * Get latest market prices with optional filters.
 */
const getPrices = async ({ commodity, state, district, limit = 50 }) => {
  const query = {};
  if (commodity) query.commodity = commodity;
  if (state) query.state = state;
  if (district) query.district = district;

  const prices = await MarketPrice.find(query)
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  // Attach MSP to each result
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

/**
 * Upsert market price record (used by cron job).
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
 * If modalPrice crosses targetPrice in correct direction → trigger alert.
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
  MSP_DATA,
  COMMODITIES,
  STATES,
};
