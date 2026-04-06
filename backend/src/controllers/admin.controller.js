const { Farmer, Advisory, PestDetection, Feedback, UsageEvent } = require('../models');
const { ok } = require('../utils/apiResponse');

const getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalFarmers, dau, advisoriesToday, scansToday] = await Promise.all([
      Farmer.countDocuments({ role: 'farmer' }),
      UsageEvent.countDocuments({ event: 'login', date: { $gte: today } }),
      Advisory.countDocuments({ createdAt: { $gte: today } }),
      PestDetection.countDocuments({ createdAt: { $gte: today } }),
    ]);

    // Language distribution
    const langDist = await Farmer.aggregate([
      { $match: { role: 'farmer' } },
      { $group: { _id: '$preferredLang', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top queried crops
    const topCrops = await Advisory.aggregate([
      { $match: { 'contextSnapshot.crop': { $exists: true, $ne: '' } } },
      { $group: { _id: '$contextSnapshot.crop', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Advisory type split
    const advisoryTypes = await Advisory.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return ok(res, {
      stats: { totalFarmers, dau, advisoriesToday, scansToday },
      charts: { langDist, topCrops, advisoryTypes },
    });
  } catch (error) {
    next(error);
  }
};

const getFarmers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = { role: 'farmer' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'location.district': { $regex: search, $options: 'i' } },
      ];
    }

    const [farmers, total] = await Promise.all([
      Farmer.find(query)
        .select('-passwordHash -otp -otpExpiresAt -refreshToken -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Farmer.countDocuments(query),
    ]);

    return ok(res, {
      farmers,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getFeedback = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [feedback, total, ratingDist] = await Promise.all([
      Feedback.find()
        .populate('farmerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(),
      Feedback.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return ok(res, {
      feedback,
      ratingDistribution: ratingDist,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const getPestLog = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [detections, total] = await Promise.all([
      PestDetection.find()
        .populate('farmerId', 'name email location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PestDetection.countDocuments(),
    ]);

    return ok(res, {
      detections,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getFarmers, getFeedback, getPestLog };
