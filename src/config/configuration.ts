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
});
