import type { Request, Response } from 'express';
import { logger } from '../../services/logger/index.js';
import {
  getCache,
  setCache,
  deleteCache,
  clearCacheByPrefix,
} from './cache.service.js';
import {
  buildCacheKey,
  buildCacheKeyFromRequest,
  calculateCacheAge,
  setCacheHeaders,
  shouldCacheResponse,
} from './cache.helpers.js';
import type {
  CachedResponse,
  CacheInvalidationInfo,
  CacheOptions,
} from './cache.types.js';

/**
 * Handle cache hit scenario
 */
export async function handleCacheHit(
  res: Response,
  cached: CachedResponse,
  prefix: string,
  cacheKey: string
): Promise<void> {
  const age = calculateCacheAge(cached.timestamp);
  const fullCacheKey = buildCacheKey(prefix, cacheKey);

  setCacheHeaders(res, 'HIT', fullCacheKey, age);
  logger.info(`[Cache] HIT: ${prefix}:${cacheKey}`);

  res.status(cached.statusCode).json(cached.body);
}

/**
 * Handle cache miss scenario
 */
export function handleCacheMiss(
  res: Response,
  prefix: string,
  cacheKey: string,
  ttl: number
): void {
  res.locals.cacheInfo = { prefix, key: cacheKey, ttl };
  setCacheHeaders(res, 'MISS', buildCacheKey(prefix, cacheKey));

  logger.info(`[Cache] MISS: ${prefix}:${cacheKey}`);
}

/**
 * Attempt to retrieve cached response
 */
export async function retrieveCachedResponse(
  req: Request,
  res: Response,
  options: CacheOptions
): Promise<boolean> {
  const { prefix, ttl = 60, keyBuilder, skipCache } = options;

  // Only cache GET requests
  if (req.method !== 'GET') {
    return false;
  }

  // Skip cache if condition met
  if (skipCache?.(req)) {
    return false;
  }

  const cacheKey = buildCacheKeyFromRequest(req, keyBuilder);

  try {
    const cached = await getCache<CachedResponse>(prefix, cacheKey);

    if (cached) {
      await handleCacheHit(res, cached, prefix, cacheKey);
      return true;
    }

    handleCacheMiss(res, prefix, cacheKey, ttl);
    return false;
  } catch (error) {
    logger.error('[Cache] Error retrieving cached response:', error);
    return false;
  }
}

/**
 * Store response in cache
 */
export async function storeCachedResponse(
  body: any,
  statusCode: number,
  cacheInfo: {
    prefix: string;
    key: string;
    ttl: number;
  }
): Promise<void> {
  if (!shouldCacheResponse(statusCode)) {
    return;
  }

  const dataToCache: CachedResponse = {
    body,
    statusCode,
    timestamp: Date.now(),
  };

  try {
    await setCache(cacheInfo.prefix, cacheInfo.key, dataToCache, cacheInfo.ttl);
    logger.debug(`[Cache] Stored: ${cacheInfo.prefix}:${cacheInfo.key}`);
  } catch (err) {
    logger.error('[Cache] Failed to store:', err);
  }
}

/**
 * Handle cache invalidation
 */
export async function handleInvalidation(
  info: CacheInvalidationInfo
): Promise<void> {
  try {
    if (info.clearAll) {
      await clearCacheByPrefix(info.prefix);
      logger.info(`[Cache] Invalidated prefix: ${info.prefix}`);
    } else if (info.keys && info.keys.length > 0) {
      await Promise.all(
        info.keys.map((key: string) => deleteCache(info.prefix, key))
      );
      logger.info(`[Cache] Invalidated ${info.keys.length} key(s)`);
    }
  } catch (error) {
    logger.error('[Cache] Invalidation error:', error);
  }
}
