const mongoose = require('mongoose');

const pestDetectionSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    cropType: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    publicId: {
      type: String,
      default: '',
    },
    disease: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    treatment: {
      type: [String],
      default: [],
    },
    organic: {
      type: [String],
      default: [],
    },
    chemical: {
      type: [String],
      default: [],
    },
    geminiVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PestDetection', pestDetectionSchema);
