const { z } = require('zod');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  EMAIL_USER: z.string().email('EMAIL_USER must be a valid email'),
  EMAIL_PASSWORD: z.string().min(1, 'EMAIL_PASSWORD is required (Gmail App Password)'),
  CLIENT_ID: z.string().optional().default(''),
  CLIENT_SECRET: z.string().optional().default(''),
  REFRESH_TOKEN: z.string().optional().default(''),

  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-flash-latest'),
  GEMINI_RATE_LIMIT_RPM: z.coerce.number().default(60),

  HF_API_KEY: z.string().min(1, 'HF_API_KEY is required'),
  HF_MODEL: z.string().default('mistral-community/Mistral-7B-Instruct-v0.1'),

  OWM_API_KEY: z.string().min(1, 'OWM_API_KEY is required'),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  ML_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  IDEMPOTENCY_TTL_MS: z.coerce.number().default(30000),

  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_PHONE: z.string().default('+14155238886'),
  WHATSAPP_ENABLED: z.coerce.boolean().default(false),
});

let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Environment validation failed:');
  if (error instanceof z.ZodError) {
    error.issues.forEach((issue) => {
      console.error(`   → ${issue.path.join('.')}: ${issue.message}`);
    });
  }
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.warn('⚠️  Running in development mode with partial env. Some features may not work.');
    env = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT) || 5000,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/kisansaathi',
      JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production_64chars_abcdefghijklmnopqrstuvwxyz012345',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production_64chars_zyxwvutsrqponmlkjihgfed',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      EMAIL_USER: process.env.EMAIL_USER || '',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
      CLIENT_ID: process.env.CLIENT_ID || '',
      CLIENT_SECRET: process.env.CLIENT_SECRET || '',
      REFRESH_TOKEN: process.env.REFRESH_TOKEN || '',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
      GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      GEMINI_RATE_LIMIT_RPM: parseInt(process.env.GEMINI_RATE_LIMIT_RPM) || 60,
      HF_API_KEY: process.env.HF_API_KEY || '',
      HF_MODEL: process.env.HF_MODEL || 'mistral-community/Mistral-7B-Instruct-v0.1',
      OWM_API_KEY: process.env.OWM_API_KEY || '',
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
      ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
      IDEMPOTENCY_TTL_MS: parseInt(process.env.IDEMPOTENCY_TTL_MS) || 30000,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
      TWILIO_PHONE: process.env.TWILIO_PHONE || '+14155238886',
      WHATSAPP_ENABLED: process.env.WHATSAPP_ENABLED === 'true',
    };
  }
}

module.exports = env;
