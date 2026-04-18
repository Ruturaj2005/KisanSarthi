const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Scheme title is required'],
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      default: '',
    },
    benefits: {
      type: String,
      default: '',
    },
    eligibility: {
      type: String,
      default: '',
    },
    applicationUrl: {
      type: String,
      default: '',
    },
    portal: {
      type: String,
      enum: ['aapla_sarkar', 'other'],
      default: 'aapla_sarkar',
    },
    category: {
      type: String,
      enum: ['loan', 'subsidy', 'insurance', 'tech', 'input', 'other'],
      default: 'other',
    },
    state: {
      type: String,
      default: 'Maharashtra',
    },
    scrapedAt: {
      type: Date,
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

schemeSchema.index({ externalId: 1 });
schemeSchema.index({ portal: 1, state: 1 });
schemeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Scheme', schemeSchema);
