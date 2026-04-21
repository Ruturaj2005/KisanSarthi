const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema(
  {
    commodity: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      default: '',
    },
    mandi: {
      type: String,
      required: true,
    },
    variety: {
      type: String,
      default: '',
    },
    grade: {
      type: String,
      default: '',
    },
    minPrice: {
      type: Number,
      required: true,
    },
    maxPrice: {
      type: Number,
      required: true,
    },
    modalPrice: {
      type: Number,
      required: true,
    },
    msp: {
      type: Number,
      default: null,
    },
    date: {
      type: Date,
      required: true,
    },
    source: {
      type: String,
      default: 'agmarknet',
    },
  },
  {
    timestamps: true,
  }
);

marketPriceSchema.index({ commodity: 1, mandi: 1, date: 1 }, { unique: true });
marketPriceSchema.index({ date: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
