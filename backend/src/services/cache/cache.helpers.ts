import type { Request, Response } from 'express';
import type { CacheStatus } from './cache.types.js';

/**
 * Sanitize cache key to prevent Redis injection
 */
export function sanitizeCacheKey(key: string): string {
  if (!key) return '';

  return key
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9:/_?&=.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Build full cache key with prefix
 */
export function buildCacheKey(prefix: string, key: string): string {
  if (!prefix || !key) {
    throw new Error('Cache prefix and key are required');
  }

  return `${sanitizeCacheKey(prefix)}:${sanitizeCacheKey(key)}`;
}

/**
 * Calculate cache age in seconds
 */
export function calculateCacheAge(timestamp: number): number {
  return Math.floor((Date.now() - timestamp) / 1000);
}

/**
 * Set cache-related headers on response
 */
export function setCacheHeaders(
  res: Response,
  status: CacheStatus,
  cacheKey: string,
  age?: number
): void {
  res.setHeader('X-Cache', status);
  res.setHeader('X-Cache-Key', cacheKey);

  if (age !== undefined) {
    res.setHeader('Age', age.toString());
  }
}

/**
 * Check if response should be cached (2xx status codes)
 */
export function shouldCacheResponse(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Build cache key from request
 */
export function buildCacheKeyFromRequest(
  req: Request,
  keyBuilder?: (req: Request) => string
): string {
  return keyBuilder ? keyBuilder(req) : req.originalUrl;
}

/**
 * Validate cache options
 */
export function validateCacheOptions(options: {
  prefix?: string;
  key?: string;
}): void {
  if (!options.prefix) {
    throw new Error('Cache prefix is required');
  }
  if (!options.key) {
    throw new Error('Cache key is required');
  }
}
