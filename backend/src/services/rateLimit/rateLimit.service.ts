import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../services/logger/index.js';
import { setKey, incrKey } from '../../services/redis/redis.helpers.js';
import { TooManyRequestsError } from '../../utils/CustomError.js';
import {
  getRateLimitStatus,
  setRateLimitHeaders,
  calculateRetryAfter,
  windowMsToSeconds,
  shouldRateLimit,
} from './rateLimit.helpers.js';
import type { RateLimitContext } from './rateLimit.types.js';

/**
 * Handle standard rate limiting (count all requests)
 */
export async function handleStandardRateLimit(
  _req: Request,
  res: Response,
  next: NextFunction,
  context: RateLimitContext
): Promise<void> {
  const { key, limit, windowMs, message, standardHeaders } = context;
  const ttlSeconds = windowMsToSeconds(windowMs);

  // Get current status
  const status = await getRateLimitStatus(key, limit, windowMs);

  // First request in window - initialize
  if (status.current === 0) {
    await setKey(key, '1', ttlSeconds);
    setRateLimitHeaders(
      res,
      {
        current: 1,
        limit,
        remaining: limit - 1,
        resetTime: Date.now() + windowMs,
      },
      standardHeaders
    );
    return next();
  }

  // Limit exceeded - reject request
  if (shouldRateLimit(status.current, limit)) {
    setRateLimitHeaders(res, status, standardHeaders);
    return next(
      new TooManyRequestsError(message, {
        limit,
        retryAfter: calculateRetryAfter(status.resetTime),
      })
    );
  }

  // Increment and continue
  const newCount = await incrKey(key, ttlSeconds);

  setRateLimitHeaders(
    res,
    {
      current: newCount,
      limit,
      remaining: limit - newCount,
      resetTime: status.resetTime,
    },
    standardHeaders
  );

  return next();
}

/**
 * Handle rate limiting that skips successful requests (only counts errors)
 */
export async function handleSkipSuccessfulRequests(
  req: Request,
  res: Response,
  next: NextFunction,
  context: RateLimitContext
): Promise<void> {
  const { key, limit, windowMs, message } = context;
  const ttlSeconds = windowMsToSeconds(windowMs);

  // Check current status
  const status = await getRateLimitStatus(key, limit, windowMs);

  // Set headers
  setRateLimitHeaders(res, status);

  // Already rate limited
  if (shouldRateLimit(status.current, limit)) {
    return next(
      new TooManyRequestsError(message, {
        limit,
        retryAfter: calculateRetryAfter(status.resetTime),
      })
    );
  }

  // Intercept response to increment only on failures
  interceptResponseForErrorCounting(req, res, key, ttlSeconds);

  return next();
}

/**
 * Intercept response methods to count only failed requests
 */
function interceptResponseForErrorCounting(
  req: Request,
  res: Response,
  key: string,
  ttlSeconds: number
): void {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let hasIncremented = false;

  const incrementOnError = async () => {
    if (hasIncremented || res.statusCode < 400) {
      return;
    }

    hasIncremented = true;

    try {
      await incrKey(key, ttlSeconds);
      logger.debug('Rate limit incremented for failed request', {
        key,
        statusCode: res.statusCode,
        path: req.path,
      });
    } catch (err) {
      logger.error('Failed to increment rate limit', {
        key,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  // Override json method
  res.json = function (body?: any): Response {
    incrementOnError().catch(err => {
      logger.error('Error in json interceptor', { error: err });
    });
    return originalJson(body);
  };

  // Override send method (for non-JSON responses)
  res.send = function (body?: any): Response {
    incrementOnError().catch(err => {
      logger.error('Error in send interceptor', { error: err });
    });
    return originalSend(body);
  };
}

/**
 * Handle rate limit exceeded scenario
 */
export function handleRateLimitExceeded(
  message: string,
  limit: number,
  resetTime: number
): TooManyRequestsError {
  return new TooManyRequestsError(message, {
    limit,
    retryAfter: calculateRetryAfter(resetTime),
  });
}

/**
 * Handle rate limit check failure
 */
export function handleRateLimitCheckFailure(
  limit: number,
  windowMs: number
): TooManyRequestsError {
  return new TooManyRequestsError('Rate limit check failed', {
    limit,
    retryAfter: windowMsToSeconds(windowMs),
  });
}
