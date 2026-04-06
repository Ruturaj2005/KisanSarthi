const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    commodity: {
      type: String,
      required: true,
    },
    mandi: {
      type: String,
      required: true,
    },
    targetPrice: {
      type: Number,
      required: true,
    },
    direction: {
      type: String,
      enum: ['above', 'below'],
      required: true,
    },
    isTriggered: {
      type: Boolean,
      default: false,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
    triggeredPrice: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

priceAlertSchema.index({ commodity: 1, mandi: 1, isActive: 1 });

module.exports = mongoose.model('PriceAlert', priceAlertSchema);
