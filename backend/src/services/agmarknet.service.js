const axios = require('axios');
const { LRUCache } = require('lru-cache');
const logger = require('../utils/logger');

// ── Constants ────────────────────────────────────────────────────────
const AGMARKNET_BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const API_KEY = process.env.AGMARKNET;

// ── LRU Cache (5-minute TTL) ─────────────────────────────────────────
const cache = new LRUCache({
  max: 100,
  ttl: 5 * 60 * 1000, // 5 minutes
});

// Longer TTL cache for filter options (10 minutes)
const filterCache = new LRUCache({
  max: 10,
  ttl: 10 * 60 * 1000, // 10 minutes
});

/**
 * Build query params for the AGMARKNET API.
 */
function buildParams({ state, district, commodity, market, limit = 500, offset = 0 } = {}) {
  const params = {
    'api-key': API_KEY,
    format: 'json',
    limit,
    offset,
  };

  if (state) params['filters[state.keyword]'] = state;
  if (district) params['filters[district]'] = district;
  if (commodity) params['filters[commodity]'] = commodity;
  if (market) params['filters[market]'] = market;

  return params;
}

/**
 * Parse an arrival_date string (DD/MM/YYYY) into a JS Date.
 */
function parseArrivalDate(dateStr) {
  if (!dateStr) return new Date();
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // DD/MM/YYYY → YYYY-MM-DD
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  return new Date(dateStr);
}

/**
 * Map a single AGMARKNET API record to our internal schema.
 */
function mapRecord(record) {
  return {
    state: record.state || '',
    district: record.district || '',
    mandi: record.market || '',
    commodity: record.commodity || '',
    variety: record.variety || '',
    grade: record.grade || '',
    minPrice: parseFloat(record.min_price) || 0,
    maxPrice: parseFloat(record.max_price) || 0,
    modalPrice: parseFloat(record.modal_price) || 0,
    date: parseArrivalDate(record.arrival_date),
    source: 'agmarknet',
  };
}

/**
 * Fetch prices from the AGMARKNET API.
 * @param {Object} options - Filter options
 * @returns {Promise<{records: Array, total: number, count: number}>}
 */
async function fetchPrices({ state, district, commodity, market, limit = 500, offset = 0 } = {}) {
  const cacheKey = `prices:${state || ''}:${district || ''}:${commodity || ''}:${market || ''}:${limit}:${offset}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    logger.debug('AGMARKNET cache hit', { service: 'agmarknet', meta: { cacheKey } });
    return cached;
  }

  try {
    const params = buildParams({ state, district, commodity, market, limit, offset });

    logger.info('Fetching from AGMARKNET API', {
      service: 'agmarknet',
      meta: { state, district, commodity, market, limit, offset },
    });

    const { data } = await axios.get(AGMARKNET_BASE_URL, {
      params,
      timeout: 15000,
    });

    if (data.status !== 'ok') {
      throw new Error(`AGMARKNET API returned status: ${data.status}`);
    }

    const records = (data.records || []).map(mapRecord);
    const result = {
      records,
      total: data.total || 0,
      count: data.count || 0,
    };

    cache.set(cacheKey, result);

    logger.info(`AGMARKNET fetched ${records.length} records (total: ${result.total})`, {
      service: 'agmarknet',
    });

    return result;
  } catch (error) {
    logger.error('AGMARKNET API error', {
      service: 'agmarknet',
      meta: { error: error.message, code: error.code },
    });
    throw error;
  }
}

/**
 * Fetch filter options (unique states, districts, commodities) from AGMARKNET.
 * Fetches a broad set and extracts distinct values.
 */
async function fetchFilters({ state, district } = {}) {
  const cacheKey = `filters:${state || ''}:${district || ''}`;
  const cached = filterCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Fetch a large batch to get diverse filter values
    const { records } = await fetchPrices({ state, district, limit: 500 });

    const statesSet = new Set();
    const districtsSet = new Set();
    const commoditiesSet = new Set();

    records.forEach((r) => {
      if (r.state) statesSet.add(r.state);
      if (r.district) districtsSet.add(r.district);
      if (r.commodity) commoditiesSet.add(r.commodity);
    });

    // If no state filter, also fetch without filter for broader state list
    if (!state && !district) {
      // Try fetching with a larger offset to get more diverse states
      try {
        const { records: moreRecords } = await fetchPrices({ limit: 500, offset: 500 });
        moreRecords.forEach((r) => {
          if (r.state) statesSet.add(r.state);
          if (r.district) districtsSet.add(r.district);
          if (r.commodity) commoditiesSet.add(r.commodity);
        });
      } catch {
        // ignore — first batch is enough
      }
    }

    const result = {
      states: [...statesSet].sort(),
      districts: [...districtsSet].sort(),
      commodities: [...commoditiesSet].sort(),
    };

    filterCache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.error('Failed to fetch AGMARKNET filters', {
      service: 'agmarknet',
      meta: { error: error.message },
    });
    throw error;
  }
}

/**
 * Fetch prices for cron sync (bulk fetch for DB storage).
 * Fetches multiple pages to get comprehensive data.
 */
async function fetchBulkPrices({ limit = 500, pages = 2 } = {}) {
  const allRecords = [];

  for (let page = 0; page < pages; page++) {
    try {
      const { records } = await fetchPrices({ limit, offset: page * limit });
      allRecords.push(...records);

      // If we got fewer records than requested, we've reached the end
      if (records.length < limit) break;
    } catch (error) {
      logger.error(`AGMARKNET bulk fetch page ${page} failed`, {
        service: 'agmarknet',
        meta: { error: error.message },
      });
      // Continue with whatever we have
      break;
    }
  }

  return allRecords;
}

module.exports = {
  fetchPrices,
  fetchFilters,
  fetchBulkPrices,
  mapRecord,
  parseArrivalDate,
};
