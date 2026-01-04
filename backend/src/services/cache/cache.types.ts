import type { Request } from 'express';

/**
 * Cached response structure
 */
export interface CachedResponse {
  body: any;
  statusCode: number;
  timestamp: number;
}

/**
 * Cache configuration options
 */
export interface CacheOptions {
  prefix: string;
  ttl?: number;
  keyBuilder?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

/**
 * Cache info stored in res.locals
 */
export interface CacheInfo {
  prefix: string;
  key: string;
  ttl: number;
}

/**
 * Cache invalidation info stored in res.locals
 */
export interface CacheInvalidationInfo {
  prefix: string;
  keys?: string[];
  clearAll?: boolean;
}

/**
 * Cache status type
 */
export type CacheStatus = 'HIT' | 'MISS';
