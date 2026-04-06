const { CropHistory } = require('../models');
const { ok, err } = require('../utils/apiResponse');

const create = async (req, res, next) => {
  try {
    const history = await CropHistory.create({
      farmerId: req.farmerId,
      ...req.body,
    });
    return ok(res, { history }, 'Crop history added', 201);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const history = await CropHistory.find({ farmerId: req.farmerId })
      .sort({ createdAt: -1 })
      .lean();
    return ok(res, { history });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const history = await CropHistory.findOneAndUpdate(
      { _id: req.params.id, farmerId: req.farmerId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!history) {
      return err(res, 'Crop history not found', 'NOT_FOUND', 404);
    }
    return ok(res, { history }, 'Updated');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const history = await CropHistory.findOneAndDelete({
      _id: req.params.id,
      farmerId: req.farmerId,
    });
    if (!history) {
      return err(res, 'Crop history not found', 'NOT_FOUND', 404);
    }
    return ok(res, null, 'Deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, update, remove };
