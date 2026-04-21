const mongoose = require('mongoose');

const schemeNotificationSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
    },
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'bounced'],
      default: 'pending',
    },
    messageId: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

schemeNotificationSchema.index({ farmerId: 1, schemeId: 1 }, { unique: true });
schemeNotificationSchema.index({ status: 1 });
schemeNotificationSchema.index({ sentAt: -1 });
schemeNotificationSchema.index({ retryCount: 1, status: 1 });

module.exports = mongoose.model('SchemeNotification', schemeNotificationSchema);
