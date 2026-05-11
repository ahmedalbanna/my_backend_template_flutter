import * as Joi from 'joi';

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),

  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    // frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
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

  email: {
    from: process.env.SMTP_FROM || 'noreply@example.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),

  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || String(10 * 1024 * 1024), 10),
  },
});

export const validationSchema = Joi.object({
  // App
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_BASE_URL: Joi.string().uri().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:4200'),

  // Database
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL is required. Please set it in your .env file.',
  }),

  // JWT
  JWT_SECRET: Joi.string().min(16).required().messages({
    'any.required': 'JWT_SECRET is required.',
    'string.min': 'JWT_SECRET must be at least 16 characters long.',
  }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required().messages({
    'any.required': 'JWT_REFRESH_SECRET is required.',
    'string.min': 'JWT_REFRESH_SECRET must be at least 16 characters long.',
  }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // Email (optional – if not set, emails log a warning)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_FROM: Joi.string().email().default('noreply@example.com'),

  // Redis (optional – if not set, Bull Queue won't connect)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // Upload
  UPLOAD_DIR: Joi.string().default('./uploads'),
  UPLOAD_MAX_SIZE: Joi.number().default(10 * 1024 * 1024),
});
