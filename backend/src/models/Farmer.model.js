const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['farmer', 'admin'],
      default: 'farmer',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    location: {
      state: { type: String, default: '' },
      district: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    landSize: {
      type: Number,
      default: null,
      min: 0,
    },
    soilType: {
      type: String,
      enum: ['loamy', 'sandy', 'clay', 'silt', 'alluvial', ''],
      default: '',
    },
    irrigationSrc: {
      type: String,
      enum: ['rain', 'canal', 'borewell', 'drip', 'none', ''],
      default: '',
    },
    primaryCrops: {
      type: [String],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Maximum 10 primary crops allowed',
      },
      default: [],
    },
    preferredLang: {
      type: String,
      enum: ['en', 'hi', 'mr', 'pa', 'te', 'ta'],
      default: 'hi',
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

farmerSchema.index({ email: 1 }, { unique: true });
farmerSchema.index({ role: 1 });

farmerSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  delete obj.otpExpiresAt;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Farmer', farmerSchema);
