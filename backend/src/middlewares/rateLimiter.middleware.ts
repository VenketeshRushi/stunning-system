import type { Request, Response, NextFunction } from 'express';
import { config } from './../config/index.js';
import { logger } from './../services/logger/index.js';
import { getClientIp } from './../utils/ext.js';
import {
  getRateLimitKey,
  getClientIdentifier,
} from './../services/rateLimit/rateLimit.helpers.js';
import {
  handleStandardRateLimit,
  handleSkipSuccessfulRequests,
  handleRateLimitCheckFailure,
} from './../services/rateLimit/rateLimit.service.js';
import type {
  RateLimitConfig,
  RateLimitContext,
} from './../services/rateLimit/rateLimit.types.js';

const rateLimitConfig = config.rateLimit;

type RateLimitType = keyof typeof rateLimitConfig;

/**
 * Rate limiter middleware factory
 *
 * Creates a rate limiting middleware for the specified type
 *
 * @param type - Rate limit type from config (e.g., 'global', 'api', 'auth')
 * @returns Express middleware function
 *
 * @example
 * // Apply global rate limit
 * app.use(rateLimiterMiddleware('global'));
 *
 * @example
 * // Apply API-specific rate limit
 * router.use('/api', rateLimiterMiddleware('api'));
 */
export const rateLimiterMiddleware = (type: RateLimitType = 'global') => {
  const config = rateLimitConfig[type] as RateLimitConfig;
  const {
    max: limit,
    windowMs,
    bypass,
    failClosed,
    skipSuccessfulRequests = false,
    message = 'Too many requests',
    standardHeaders = true,
  } = config;

  const redisPrefix = config.redisPrefix || 'rl';

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Bypass if configured
    if (bypass) {
      return next();
    }

    try {
      // Get identifier with fallback chain
      const identifier = getClientIdentifier(req, getClientIp);

      // Fail closed if identifier cannot be determined
      if (identifier === 'unknown' && failClosed) {
        logger.warn('Cannot determine client identifier', {
          type,
          path: req.path,
          headers: req.headers,
        });
        return next(new Error('Cannot determine client identifier'));
      }

      // Generate rate limit key
      const key = getRateLimitKey(redisPrefix, type, identifier, req.path);

      // Create context for handlers
      const context: RateLimitContext = {
        key,
        limit,
        windowMs,
        message,
        standardHeaders,
      };

      // Handle different rate limiting strategies
      if (skipSuccessfulRequests) {
        return await handleSkipSuccessfulRequests(req, res, next, context);
      } else {
        return await handleStandardRateLimit(req, res, next, context);
      }
    } catch (err) {
      logger.error('Rate limiter error', {
        type,
        path: req.path,
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });

      // Fail open or closed based on configuration
      if (failClosed) {
        return next(handleRateLimitCheckFailure(limit, windowMs));
      }

      // Fail open - allow request to proceed
      return next();
    }
  };
};
