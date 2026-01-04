import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../services/logger/index.js';
import {
  shouldCacheResponse,
  buildCacheKeyFromRequest,
} from '../../services/cache/cache.helpers.js';
import {
  retrieveCachedResponse,
  storeCachedResponse,
  handleInvalidation,
} from '../../services/cache/cache.handlers.js';
import type {
  CacheOptions,
  CacheInfo,
  CacheInvalidationInfo,
} from '../../services/cache/cache.types.js';

/**
 * Cache middleware for GET requests
 * Checks cache and serves cached response if available
 */
export function cacheMiddleware(options: CacheOptions) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const cacheHit = await retrieveCachedResponse(req, res, options);

      // If cache hit, response already sent
      if (cacheHit) {
        return;
      }

      // Continue to next middleware
      next();
    } catch (error) {
      logger.error('[Cache] Error in cacheMiddleware:', error);
      next(); // Continue without cache on error
    }
  };
}

/**
 * Global middleware to cache successful responses
 * Apply this ONCE globally after requestLogger
 *
 * This intercepts res.json() to:
 * 1. Store successful responses in cache
 * 2. Invalidate cache on mutations
 */
export function cacheHandler() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      // Cache successful responses
      const cacheInfo: CacheInfo = res.locals.cacheInfo;
      if (cacheInfo && shouldCacheResponse(res.statusCode)) {
        storeCachedResponse(body, res.statusCode, cacheInfo).catch(err =>
          logger.error('[Cache] Failed to store:', err)
        );
      }

      // Invalidate cache on mutations
      const invalidateInfo: CacheInvalidationInfo = res.locals.cacheInvalidate;
      if (invalidateInfo && shouldCacheResponse(res.statusCode)) {
        handleInvalidation(invalidateInfo).catch(err =>
          logger.error('[Cache] Failed to invalidate:', err)
        );
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Mark cache for invalidation (single key)
 *
 * Usage:
 * router.post('/api/users/:id', invalidateCache('users', req => req.params.id))
 */
export function invalidateCache(
  prefix: string,
  keyBuilder?: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = buildCacheKeyFromRequest(req, keyBuilder);
    res.locals.cacheInvalidate = { prefix, keys: [key] };
    next();
  };
}

/**
 * Mark multiple keys for invalidation
 *
 * Usage:
 * router.post('/api/users/:id', invalidateMultipleCache('users', [
 *   req => `/users/${req.params.id}`,
 *   req => `/users`
 * ]))
 */
export function invalidateMultipleCache(
  prefix: string,
  keyBuilders: ((req: Request) => string)[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const keys = keyBuilders.map(builder => builder(req));
    res.locals.cacheInvalidate = { prefix, keys };
    next();
  };
}

/**
 * Invalidate entire prefix
 *
 * Usage:
 * router.post('/api/users/bulk-update', invalidateCacheByPrefix('users'))
 */
export function invalidateCacheByPrefix(prefix: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.locals.cacheInvalidate = { prefix, clearAll: true };
    next();
  };
}
