const { Farmer } = require('../models');
const { ok, err } = require('../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.farmerId).lean();
    if (!farmer) {
      return err(res, 'Farmer not found', 'NOT_FOUND', 404);
    }
    const { passwordHash, otp, otpExpiresAt, refreshToken, __v, ...safe } = farmer;
    return ok(res, { farmer: safe });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'landSize', 'soilType', 'irrigationSrc', 'primaryCrops', 'location', 'preferredLang'];
    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    const farmer = await Farmer.findByIdAndUpdate(
      req.farmerId,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!farmer) {
      return err(res, 'Farmer not found', 'NOT_FOUND', 404);
    }
    return ok(res, { farmer: farmer.toSafeObject() }, 'Profile updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
