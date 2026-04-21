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

    // ── Core Parameters ────────────────────────────────────────
    ph: {
      type: Number,
      min: 4.0,
      max: 9.0,
      required: true,
    },
    organicCarbon: {
      type: Number,
      min: 0,
      max: 3,
      default: null,
    },
    ec: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },

    // ── Major Nutrients (categorical) ──────────────────────────
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

    // ── Major Nutrients (numeric, kg/ha) ───────────────────────
    nitrogenValue: { type: Number, default: null },
    phosphorusValue: { type: Number, default: null },
    potassiumValue: { type: Number, default: null },

    // ── Micronutrients (ppm) ───────────────────────────────────
    zinc: { type: Number, default: null },
    iron: { type: Number, default: null },
    boron: { type: Number, default: null },
    manganese: { type: Number, default: null },

    // ── Results ────────────────────────────────────────────────
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
    inputMode: {
      type: String,
      enum: ['quick', 'advanced'],
      default: 'quick',
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
