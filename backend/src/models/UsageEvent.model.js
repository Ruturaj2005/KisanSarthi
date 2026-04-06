const mongoose = require('mongoose');

const usageEventSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      index: true,
      default: null,
    },
    hashedFarmerId: {
      type: String,
      default: '',
    },
    event: {
      type: String,
      required: true,
      enum: [
        'login', 'register', 'chat_query', 'pest_scan',
        'soil_test', 'market_view', 'price_alert_created',
        'weather_view', 'profile_update', 'advisory_feedback',
        'language_switch', 'voice_input', 'tts_play',
      ],
    },
    metadata: {
      type: Object,
      default: {},
    },
    hashedLocation: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

usageEventSchema.index({ date: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
usageEventSchema.index({ event: 1, date: -1 });

module.exports = mongoose.model('UsageEvent', usageEventSchema);
