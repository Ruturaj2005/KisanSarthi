const { Scheme, SchemeNotification, Farmer } = require('../models');
const { ok, err } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { broadcastScheme: broadcastViaWhatsApp } = require('../services/whatsapp.service');

/**
 * Get all schemes for a farmer
 */
const getSchemes = async (req, res, next) => {
  try {
    const schemes = await Scheme.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get notification status for this farmer
    const notificationMap = await SchemeNotification.find({
      farmerId: req.farmerId,
    })
      .select('schemeId status sentAt')
      .lean()
      .then(nots => {
        const map = {};
        nots.forEach(n => {
          map[n.schemeId.toString()] = {
            status: n.status,
            sentAt: n.sentAt,
          };
        });
        return map;
      });

    const schemesWithNotification = schemes.map(scheme => ({
      ...scheme,
      notification: notificationMap[scheme._id.toString()] || null,
    }));

    return ok(res, { schemes: schemesWithNotification });
  } catch (error) {
    next(error);
  }
};

/**
 * Get scheme details
 */
const getSchemeDetails = async (req, res, next) => {
  try {
    const scheme = await Scheme.findById(req.params.id).lean();
    if (!scheme) {
      return err(res, 'Scheme not found', 'NOT_FOUND', 404);
    }

    const notification = await SchemeNotification.findOne({
      farmerId: req.farmerId,
      schemeId: scheme._id,
    })
      .lean();

    return ok(res, { scheme, notification });
  } catch (error) {
    next(error);
  }
};

/**
 * Get farmer's notification history
 */
const getNotificationHistory = async (req, res, next) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const notifications = await SchemeNotification.find({
      farmerId: req.farmerId,
    })
      .populate('schemeId', 'title benefits applicationUrl')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await SchemeNotification.countDocuments({
      farmerId: req.farmerId,
    });

    return ok(res, { notifications, total, skip, limit });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Sync schemes (manually trigger fetch)
 */
const syncSchemes = async (req, res, next) => {
  try {
    // TODO: Implement actual scraper when Aapla Sarkar API is available
    // For now, this is a placeholder
    logger.info('🔄 Manual scheme sync triggered', { service: 'scheme' });

    return ok(res, { message: 'Sync initiated. New schemes will be fetched from Aapla Sarkar.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Broadcast scheme to all farmers
 */
const broadcastSchemeToFarmers = async (req, res, next) => {
  try {
    const { schemeId } = req.body;

    if (!schemeId) {
      return err(res, 'Scheme ID required', 'VALIDATION_ERROR', 400);
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return err(res, 'Scheme not found', 'NOT_FOUND', 404);
    }

    const farmers = await Farmer.find({
      whatsappNumber: { $exists: true, $ne: null },
      notificationsEnabled: true,
    });

    const result = await broadcastViaWhatsApp(farmers, scheme);

    logger.info('✅ Broadcast completed', {
      service: 'scheme',
      meta: result,
    });

    return ok(res, { result }, 'Broadcast complete');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin: Get all schemes
 */
const getAllSchemes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const schemes = await Scheme.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Scheme.countDocuments();

    return ok(res, {
      schemes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchemes,
  getSchemeDetails,
  getNotificationHistory,
  syncSchemes,
  broadcastSchemeToFarmers,
  getAllSchemes,
};
