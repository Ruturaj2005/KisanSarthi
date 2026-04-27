const cron = require('node-cron');
const marketService = require('./market.service');
const agmarknetService = require('./agmarknet.service');
const logger = require('../utils/logger');
const { syncPortalSchemesAndNotifyLoggedInFarmers } = require('./scheme.service');

/**
 * Fetch real market data from AGMARKNET API for DB storage.
 * Falls back to simulated data if the API is unavailable.
 */
async function fetchMarketData() {
  try {
    logger.info('Fetching market data from AGMARKNET API', { service: 'cron' });
    const records = await agmarknetService.fetchBulkPrices({ limit: 500, pages: 3 });

    if (records.length > 0) {
      logger.info(`AGMARKNET returned ${records.length} records for DB sync`, { service: 'cron' });
      return records;
    }

    logger.warn('AGMARKNET returned 0 records, falling back to simulated data', { service: 'cron' });
    return generateSimulatedData();
  } catch (error) {
    logger.error('AGMARKNET API failed for cron sync, using simulated data', {
      service: 'cron',
      meta: { error: error.message },
    });
    return generateSimulatedData();
  }
}

/**
 * Generate simulated market data as fallback (development/offline).
 */
function generateSimulatedData() {
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
 * Runs at 06:00 and 18:00 IST daily for better trend coverage.
 */
function startCronJobs() {
  // Market data sync — 06:00 and 18:00 IST daily
  cron.schedule('0 6,18 * * *', async () => {
    logger.info('Starting daily market data sync from AGMARKNET', { service: 'cron' });
    try {
      const records = await fetchMarketData();
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

  // Government scheme sync — every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    logger.info('Starting Aaple Sarkar scheme sync', { service: 'cron' });
    try {
      const result = await syncPortalSchemesAndNotifyLoggedInFarmers();
      logger.info('Scheme sync complete', {
        service: 'cron',
        meta: {
          fetched: result.sync.fetched,
          inserted: result.sync.inserted,
          updated: result.sync.updated,
          notifiedFarmers: result.notifications.farmers,
          sent: result.notifications.sent,
          failed: result.notifications.failed,
        },
      });
    } catch (error) {
      logger.error('Scheme sync failed', { service: 'cron', meta: { error: error.message } });
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('Cron jobs started (AGMARKNET sync at 06:00 & 18:00 IST)', { service: 'cron' });
}

/**
 * Run market sync immediately (for initial seed or manual trigger).
 */
const syncMarketDataNow = async () => {
  const records = await fetchMarketData();
  let upserted = 0;
  for (const record of records) {
    await marketService.upsertPrice(record);
    upserted++;
  }
  return upserted;
};

module.exports = { startCronJobs, syncMarketDataNow };
