const mongoose = require('mongoose');

const weatherAlertSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['heavy_rain', 'heat_wave', 'frost_risk', 'high_wind', 'fungal_risk'],
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

weatherAlertSchema.index({ district: 1, type: 1, createdAt: -1 });
weatherAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('WeatherAlert', weatherAlertSchema);
