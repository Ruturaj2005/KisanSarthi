const mongoose = require('mongoose');

const cropHistorySchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    cropName: {
      type: String,
      required: true,
    },
    season: {
      type: String,
      enum: ['kharif', 'rabi', 'zaid'],
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    sowingDate: {
      type: Date,
      default: null,
    },
    harvestDate: {
      type: Date,
      default: null,
    },
    yieldQty: {
      type: Number,
      default: null,
      min: 0,
    },
    yieldUnit: {
      type: String,
      default: 'quintal',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

cropHistorySchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('CropHistory', cropHistorySchema);
