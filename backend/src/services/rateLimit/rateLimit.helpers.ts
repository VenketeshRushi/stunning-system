import type { Response, Request } from 'express';
import { getKeyWithTTL } from '../../services/redis/redis.helpers.js';
import type { RateLimitInfo } from './rateLimit.types.js';

/**
 * Normalize request path to prevent bypass attempts
 */
export function normalizePath(path: string): string {
  return path
    .toLowerCase()
    .replace(/\/+/g, '/') // Replace multiple slashes with single slash
    .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
    .replace(/[^a-z0-9/_-]/g, '_'); // Replace special chars with underscore
}

/**
 * Generate rate limit key
 */
export function getRateLimitKey(
  prefix: string,
  type: string,
  identifier: string,
  path: string
): string {
  const normalizedPath = normalizePath(path);
  return `${prefix}:${type}:${identifier}:${normalizedPath}`;
}

/**
 * Set rate limit headers on response
 */
export function setRateLimitHeaders(
  res: Response,
  info: RateLimitInfo,
  standardHeaders: boolean = true
): void {
  if (standardHeaders) {
    res.setHeader('X-RateLimit-Limit', info.limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, info.remaining));
    res.setHeader('X-RateLimit-Reset', info.resetTime);

    if (info.remaining <= 0) {
      const retryAfter = calculateRetryAfter(info.resetTime);
      res.setHeader('Retry-After', Math.max(1, retryAfter));
    }
  }
}

/**
 * Get current rate limit status from Redis
 */
export async function getRateLimitStatus(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitInfo> {
  const { value, ttl } = await getKeyWithTTL(key);
  const current = value ? parseInt(value, 10) : 0;
  const remaining = Math.max(0, limit - current);

  // Calculate reset time
  let resetTime: number;
  if (ttl > 0) {
    resetTime = Date.now() + ttl * 1000;
  } else {
    resetTime = Date.now() + windowMs;
  }

  return {
    current,
    limit,
    remaining,
    resetTime,
  };
}

/**
 * Calculate seconds until rate limit reset
 */
export function calculateRetryAfter(resetTime: number): number {
  return Math.ceil((resetTime - Date.now()) / 1000);
}

/**
 * Convert window milliseconds to seconds
 */
export function windowMsToSeconds(windowMs: number): number {
  return Math.floor(windowMs / 1000);
}

/**
 * Check if request should be rate limited
 */
export function shouldRateLimit(current: number, limit: number): boolean {
  return current >= limit;
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(
  req: Request,
  getClientIp: (req: Request) => string | null
): string {
  return getClientIp(req) || req.ip || 'unknown';
}

/**
 * Validate rate limit configuration
 */
export function validateRateLimitConfig(config: {
  windowMs?: number;
  max?: number;
  redisPrefix?: string;
}): void {
  if (!config.windowMs || config.windowMs <= 0) {
    throw new Error('Rate limit windowMs must be positive');
  }
  if (!config.max || config.max <= 0) {
    throw new Error('Rate limit max must be positive');
  }
  if (!config.redisPrefix) {
    throw new Error('Rate limit redisPrefix is required');
  }
}
