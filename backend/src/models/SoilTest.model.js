const mongoose = require('mongoose');

const soilTestSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    soilType: {
      type: String,
      default: '',
    },
    ph: {
      type: Number,
      min: 4.0,
      max: 9.0,
      required: true,
    },
    nitrogen: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    phosphorus: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    potassium: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    moisture: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    crop: {
      type: String,
      default: '',
    },
    aiExplanation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SoilTest', soilTestSchema);
