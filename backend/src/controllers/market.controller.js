const marketService = require('../services/market.service');
const { ok, err } = require('../utils/apiResponse');

const getPrices = async (req, res, next) => {
  try {
    const { commodity, state, district, limit } = req.query;
    const prices = await marketService.getPrices({
      commodity, state, district, limit: parseInt(limit) || 50,
    });
    return ok(res, { prices, commodities: marketService.COMMODITIES, states: marketService.STATES });
  } catch (error) {
    next(error);
  }
};

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
    return ok(res, { trend, msp });
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

module.exports = { getPrices, getTrend, createAlert, deleteAlert, getMyAlerts };
