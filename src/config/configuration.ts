import * as Joi from 'joi';

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),

  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  otp: {
    hashSecret: process.env.OTP_HASH_SALT,
  },

  mail: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@example.com',
  },

  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },

  auth: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    accountLockMinutes: parseInt(process.env.ACCOUNT_LOCK_MINUTES || '15', 10),
    skipEmailVerification:
      process.env.SKIP_EMAIL_VERIFICATION === 'true',
  },
});

export const validationSchema = Joi.object({
  // App
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_BASE_URL: Joi.string().uri().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:4200'),

  // Database
  DATABASE_URL: Joi.string().required().messages({
    'any.required':
      'DATABASE_URL is required. Please set it in your .env file.',
  }),

  // JWT — Minimum 32 chars for production-grade security
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_SECRET is required.',
    'string.min':
      'JWT_SECRET must be at least 32 characters long for security.',
  }),
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m')
    .messages({
      'string.pattern.base':
        'JWT_EXPIRES_IN must be a valid time string (e.g. 15m, 1h, 7d)',
    }),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_REFRESH_SECRET is required.',
    'string.min':
      'JWT_REFRESH_SECRET must be at least 32 characters long for security.',
  }),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d')
    .messages({
      'string.pattern.base':
        'JWT_REFRESH_EXPIRES_IN must be a valid time string (e.g. 15m, 1h, 7d)',
    }),

  // OTP — Salt for HMAC-based OTP hashing
  OTP_HASH_SALT: Joi.string()
    .min(16)
    .default('change-me-otp-salt-min-16-chars')
    .messages({
      'string.min': 'OTP_HASH_SALT must be at least 16 characters long.',
    }),

  // Mail (SMTP)
  SMTP_HOST: Joi.string().default('smtp.ethereal.email'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  EMAIL_FROM: Joi.string().default('noreply@example.com'),

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: Joi.string().allow('').default(''),
  TWILIO_AUTH_TOKEN: Joi.string().allow('').default(''),
  TWILIO_PHONE_NUMBER: Joi.string().allow('').default(''),

  // Auth Security
  MAX_LOGIN_ATTEMPTS: Joi.number().default(5),
  ACCOUNT_LOCK_MINUTES: Joi.number().default(15),
  SKIP_EMAIL_VERIFICATION: Joi.boolean().default(false),
});
