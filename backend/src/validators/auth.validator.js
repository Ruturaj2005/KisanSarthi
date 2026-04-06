const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required').optional(),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

const resendOtpSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

const completeProfileSchema = z.object({
  landSize: z.coerce.number().min(0).optional(),
  soilType: z.enum(['loamy', 'sandy', 'clay', 'silt', 'alluvial']).optional(),
  irrigationSrc: z.enum(['rain', 'canal', 'borewell', 'drip', 'none']).optional(),
  primaryCrops: z.array(z.string()).max(10).optional(),
  location: z.object({
    state: z.string().optional(),
    district: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  preferredLang: z.enum(['en', 'hi', 'mr', 'pa', 'te', 'ta']).optional(),
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  resendOtpSchema,
  completeProfileSchema,
};
