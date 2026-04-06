const env = require('../config/env');
const logger = require('../utils/logger');
const { WeatherAlert } = require('../models');

// ── Alert Rules ────────────────────────────────────────────────────
const ALERT_RULES = [
  { condition: (w) => w.rainfall > 30, type: 'heavy_rain', action: 'Delay pesticide spraying by 2 days', severity: 'high' },
  { condition: (w) => w.temp > 42, type: 'heat_wave', action: 'Irrigate crops immediately', severity: 'high' },
  { condition: (w) => w.temp < 4, type: 'frost_risk', action: 'Cover nursery seedlings tonight', severity: 'high' },
  { condition: (w) => w.windSpeed > 40, type: 'high_wind', action: 'Do not spray — wind too strong', severity: 'medium' },
  { condition: (w) => w.humidity > 85, type: 'fungal_risk', action: 'Monitor crops for fungal disease', severity: 'medium' },
];

/**
 * Normalize OpenWeatherMap API response to standard shape.
 */
function normalizeWeather(owmData) {
  return {
    temp: Math.round(owmData.main?.temp || 0),
    feelsLike: Math.round(owmData.main?.feels_like || 0),
    humidity: owmData.main?.humidity || 0,
    pressure: owmData.main?.pressure || 0,
    windSpeed: Math.round((owmData.wind?.speed || 0) * 3.6), // m/s → km/h
    condition: owmData.weather?.[0]?.main || 'Unknown',
    description: owmData.weather?.[0]?.description || '',
    icon: owmData.weather?.[0]?.icon || '01d',
    rainfall: owmData.rain?.['1h'] || owmData.rain?.['3h'] || 0,
    visibility: owmData.visibility || 10000,
    clouds: owmData.clouds?.all || 0,
    sunrise: owmData.sys?.sunrise ? new Date(owmData.sys.sunrise * 1000) : null,
    sunset: owmData.sys?.sunset ? new Date(owmData.sys.sunset * 1000) : null,
    cityName: owmData.name || '',
  };
}

/**
 * Normalize forecast data from OWM 5-day/3-hour API.
 */
function normalizeForecast(owmForecast) {
  if (!owmForecast?.list) return [];
  return owmForecast.list.map((item) => ({
    dt: new Date(item.dt * 1000),
    temp: Math.round(item.main?.temp || 0),
    tempMin: Math.round(item.main?.temp_min || 0),
    tempMax: Math.round(item.main?.temp_max || 0),
    humidity: item.main?.humidity || 0,
    condition: item.weather?.[0]?.main || 'Unknown',
    description: item.weather?.[0]?.description || '',
    icon: item.weather?.[0]?.icon || '01d',
    windSpeed: Math.round((item.wind?.speed || 0) * 3.6),
    rainfall: item.rain?.['3h'] || 0,
  }));
}

/**
 * Fetch current weather for given coordinates.
 */
const getCurrentWeather = async (lat, lng) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${env.OWM_API_KEY}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OWM API error: ${response.status}`);
    const data = await response.json();
    return normalizeWeather(data);
  } catch (error) {
    logger.error('Weather fetch failed', { service: 'weather', meta: { error: error.message } });
    return null;
  }
};

/**
 * Fetch 5-day/3-hour forecast for given coordinates.
 */
const getForecast = async (lat, lng) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${env.OWM_API_KEY}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OWM Forecast API error: ${response.status}`);
    const data = await response.json();
    return normalizeForecast(data);
  } catch (error) {
    logger.error('Forecast fetch failed', { service: 'weather', meta: { error: error.message } });
    return [];
  }
};

/**
 * Evaluate weather data against alert rules and upsert new alerts.
 * Deduplication: don't re-alert same district+type within 24 hours.
 */
const evaluateAlerts = async (weather, district, state) => {
  const triggered = [];

  for (const rule of ALERT_RULES) {
    if (rule.condition(weather)) {
      triggered.push({
        type: rule.type,
        action: rule.action,
        severity: rule.severity,
      });
    }
  }

  // Upsert — deduplicate within 24 hours
  for (const alert of triggered) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await WeatherAlert.findOne({
      district,
      type: alert.type,
      createdAt: { $gte: twentyFourHoursAgo },
    }).lean();

    if (!existing) {
      await WeatherAlert.create({
        district,
        state,
        type: alert.type,
        action: alert.action,
        severity: alert.severity,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }
  }

  return triggered;
};

/**
 * Get active alerts for a district.
 */
const getActiveAlerts = async (district) => {
  return WeatherAlert.find({
    district,
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = {
  getCurrentWeather,
  getForecast,
  evaluateAlerts,
  getActiveAlerts,
  normalizeWeather,
};
