import { getRequiredNumberEnv } from './env.loader.js';

export const rateLimitConfig = {
  /**
   * Global fallback rate limit
   * Applied when no specific limiter is matched
   */
  global: {
    windowMs: Number(getRequiredNumberEnv('RATE_LIMIT_WINDOW_MS')) * 60 * 1000, // 5 minutes
    max: Number(getRequiredNumberEnv('RATE_LIMIT_MAX_REQUESTS')) * 60 * 1000, // e.g. 200
    redisPrefix: 'rl:global',
    message:
      'You have made too many requests in a short period. Please wait a few minutes and try again.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  /**
   * Authentication endpoints
   */
  auth: {
    windowMs: 15, // 15 minutes
    max: 20,
    redisPrefix: 'rl:auth',
    message:
      'Too many authentication attempts detected. Please wait 15 minutes before trying again.',
    skipSuccessfulRequests: true,
  },

  /**
   * Public & authenticated APIs
   */
  api: {
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 100,
    redisPrefix: 'rl:api',
    message:
      'You are sending requests too quickly. Please slow down and try again shortly.',
  },

  /**
   * Admin-only endpoints
   */
  admin: {
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 100,
    redisPrefix: 'rl:admin',
    message:
      'Admin request limit exceeded. Please wait before performing additional actions.',
  },

  /**
   * Health & readiness checks
   * Should be extremely strict
   */
  health: {
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 5,
    redisPrefix: 'rl:health',
    message: 'Health check rate limit exceeded.',
  },

  /**
   * File uploads (images, videos, docs)
   * Resource-heavy operations
   */
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    redisPrefix: 'rl:upload',
    message: 'Upload limit reached. Please wait before uploading more files.',
  },

  /**
   * Webhooks (Stripe, GitHub, etc.)
   * Should tolerate bursts but prevent abuse
   */
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    redisPrefix: 'rl:webhook',
    message: 'Webhook rate limit exceeded. Please retry after a short delay.',
  },
} as const;
