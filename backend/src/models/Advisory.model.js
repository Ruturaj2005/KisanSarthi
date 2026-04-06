const mongoose = require('mongoose');

const advisorySchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['crop', 'pest', 'weather', 'soil', 'market', 'general'],
      default: 'general',
    },
    queryText: {
      type: String,
      default: '',
    },
    contextSnapshot: {
      type: Object,
      default: {},
    },
    aiResponse: {
      type: String,
      default: '',
    },
    steps: {
      type: [String],
      default: [],
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    language: {
      type: String,
      default: 'hi',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    feedbackComment: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

advisorySchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('Advisory', advisorySchema);
