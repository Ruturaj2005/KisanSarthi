const weatherService = require('../services/weather.service');
const { ok, err } = require('../utils/apiResponse');

const getCurrentWeather = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return err(res, 'lat and lng query parameters are required', 'VALIDATION_ERROR', 400);
    }
    const weather = await weatherService.getCurrentWeather(parseFloat(lat), parseFloat(lng));
    if (!weather) {
      return err(res, 'Weather data unavailable', 'SERVICE_UNAVAILABLE', 503);
    }

    // Evaluate alerts
    const farmer = req.farmer;
    const district = farmer?.location?.district || '';
    const state = farmer?.location?.state || '';
    let alerts = [];
    if (district) {
      alerts = await weatherService.evaluateAlerts(weather, district, state);
    }

    return ok(res, { weather, alerts });
  } catch (error) {
    next(error);
  }
};

const getForecast = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return err(res, 'lat and lng query parameters are required', 'VALIDATION_ERROR', 400);
    }
    const forecast = await weatherService.getForecast(parseFloat(lat), parseFloat(lng));
    return ok(res, { forecast });
  } catch (error) {
    next(error);
  }
};

const getAlerts = async (req, res, next) => {
  try {
    const district = req.farmer?.location?.district || req.query.district;
    if (!district) {
      return err(res, 'District is required', 'VALIDATION_ERROR', 400);
    }
    const alerts = await weatherService.getActiveAlerts(district);
    return ok(res, { alerts });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCurrentWeather, getForecast, getAlerts };
