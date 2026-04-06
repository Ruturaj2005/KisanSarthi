const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['app', 'advisory', 'pest', 'market', 'general'],
      default: 'general',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      default: '',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
