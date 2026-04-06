const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { err } = require('../utils/apiResponse');
const { getFarmerMessage } = require('../utils/farmerMessages');
const { Farmer } = require('../models');

/**
 * Verify JWT access token from Authorization header.
 * Attaches farmer object to req.farmer on success.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return err(res, getFarmerMessage('UNAUTHORIZED', req.lang || 'en'), 'UNAUTHORIZED', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const farmer = await Farmer.findById(decoded.id).lean();
    if (!farmer) {
      return err(res, getFarmerMessage('UNAUTHORIZED', req.lang || 'en'), 'UNAUTHORIZED', 401);
    }

    req.farmer = farmer;
    req.farmerId = farmer._id;
    req.lang = farmer.preferredLang || 'hi';
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return err(res, getFarmerMessage('SESSION_EXPIRED', req.lang || 'en'), 'SESSION_EXPIRED', 401);
    }
    return err(res, getFarmerMessage('UNAUTHORIZED', req.lang || 'en'), 'UNAUTHORIZED', 401);
  }
};

/**
 * Check if the authenticated farmer has admin role.
 * Must be used after verifyToken middleware.
 */
const isAdmin = (req, res, next) => {
  if (!req.farmer || req.farmer.role !== 'admin') {
    return err(res, getFarmerMessage('UNAUTHORIZED', req.lang || 'en'), 'UNAUTHORIZED', 403);
  }
  next();
};

module.exports = { verifyToken, isAdmin };
