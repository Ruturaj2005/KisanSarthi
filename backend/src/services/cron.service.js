const cron = require('node-cron');
const marketService = require('./market.service');
const logger = require('../utils/logger');

/**
 * Generate simulated market data for development.
 * In production, this would fetch from Agmarknet API.
 */
function generateMarketData() {
  const records = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mandis = {
    Maharashtra: ['Mumbai APMC', 'Pune Market Yard', 'Nashik Mandi'],
    Punjab: ['Ludhiana Grain Market', 'Amritsar Mandi', 'Jalandhar Mandi'],
    UP: ['Lucknow Mandi', 'Agra Market', 'Kanpur Mandi'],
    MP: ['Indore Mandi', 'Bhopal Market', 'Jabalpur Mandi'],
    Rajasthan: ['Jaipur Mandi', 'Jodhpur Market', 'Kota Mandi'],
    AP: ['Hyderabad APMC', 'Vijayawada Market', 'Guntur Mandi'],
    Karnataka: ['Bangalore APMC', 'Hubli Market', 'Mysore Mandi'],
    Gujarat: ['Ahmedabad APMC', 'Surat Market', 'Rajkot Mandi'],
  };

  const basePrice = {
    Rice: 2500, Wheat: 2400, Maize: 2100, Cotton: 7200,
    Soybean: 5000, Onion: 1500, Tomato: 2000, Potato: 1200,
    Mustard: 5800, Chickpea: 5600, Groundnut: 6500,
  };

  for (const [state, mandiList] of Object.entries(mandis)) {
    for (const mandi of mandiList) {
      for (const commodity of marketService.COMMODITIES) {
        const base = basePrice[commodity] || 2000;
        const variance = base * 0.15;
        const modal = Math.round(base + (Math.random() - 0.5) * 2 * variance);
        records.push({
          commodity,
          state,
          district: mandi.split(' ')[0],
          mandi,
          minPrice: Math.round(modal * 0.85),
          maxPrice: Math.round(modal * 1.15),
          modalPrice: modal,
          date: today,
          source: 'simulated',
        });
      }
    }
  }

  return records;
}

/**
 * Daily market data sync job.
 * Runs at 06:00 IST daily.
 */
function startCronJobs() {
  // Market data sync — 06:00 IST daily
  cron.schedule('0 6 * * *', async () => {
    logger.info('Starting daily market data sync', { service: 'cron' });
    try {
      const records = generateMarketData();
      let upserted = 0;
      for (const record of records) {
        await marketService.upsertPrice(record);
        await marketService.checkPriceAlerts(record.commodity, record.mandi, record.modalPrice);
        upserted++;
      }
      logger.info(`Market sync complete: ${upserted} records`, { service: 'cron' });
    } catch (error) {
      logger.error('Market sync failed', { service: 'cron', meta: { error: error.message } });
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('Cron jobs started', { service: 'cron' });
}

/**
 * Run market sync immediately (for initial seed or manual trigger).
 */
const syncMarketDataNow = async () => {
  const records = generateMarketData();
  let upserted = 0;
  for (const record of records) {
    await marketService.upsertPrice(record);
    upserted++;
  }
  return upserted;
};

module.exports = { startCronJobs, syncMarketDataNow };
