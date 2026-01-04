import { logger } from '../../services/logger/index.js';
import {
  getKey,
  setKey,
  delKey,
  delKeys,
  scanKeys,
} from '../../services/redis/redis.helpers.js';
import { buildCacheKey, validateCacheOptions } from './cache.helpers.js';

/**
 * Set cache with TTL
 */
export async function setCache(
  prefix: string,
  key: string,
  value: any,
  ttl = 60
): Promise<void> {
  try {
    validateCacheOptions({ prefix, key });

    const fullKey = buildCacheKey(prefix, key);
    const serialized = JSON.stringify(value);

    await setKey(fullKey, serialized, ttl);
    logger.debug(`[Cache] SET: ${fullKey} (TTL: ${ttl}s)`);
  } catch (error) {
    logger.error(`[Cache] SET failed for ${prefix}:${key}:`, error);
    // Fail silently - cache should never break the app
  }
}

/**
 * Get cached value
 */
export async function getCache<T = any>(
  prefix: string,
  key: string
): Promise<T | null> {
  try {
    validateCacheOptions({ prefix, key });

    const fullKey = buildCacheKey(prefix, key);
    const data = await getKey(fullKey);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data) as T;
    logger.debug(`[Cache] GET: ${fullKey}`);
    return parsed;
  } catch (error) {
    logger.error(`[Cache] GET failed for ${prefix}:${key}:`, error);
    return null;
  }
}

/**
 * Delete single cache entry
 */
export async function deleteCache(prefix: string, key: string): Promise<void> {
  try {
    validateCacheOptions({ prefix, key });

    const fullKey = buildCacheKey(prefix, key);
    await delKey(fullKey);
    logger.debug(`[Cache] DEL: ${fullKey}`);
  } catch (error) {
    logger.error(`[Cache] DEL failed for ${prefix}:${key}:`, error);
  }
}

/**
 * Delete multiple cache entries
 */
export async function deleteCacheBatch(
  prefix: string,
  keys: string[]
): Promise<void> {
  if (!prefix || !keys.length) {
    return;
  }

  try {
    const fullKeys = keys.map(key => buildCacheKey(prefix, key));
    await delKeys(fullKeys);
    logger.debug(`[Cache] DEL ${fullKeys.length} keys for prefix: ${prefix}`);
  } catch (error) {
    logger.error(`[Cache] Batch delete failed for prefix ${prefix}:`, error);
  }
}

/**
 * Clear all cache entries by prefix
 */
export async function clearCacheByPrefix(prefix: string): Promise<number> {
  if (!prefix) {
    return 0;
  }

  try {
    const pattern = `${prefix}:*`;
    const keys = await scanKeys(pattern);

    if (keys.length === 0) {
      logger.debug(`[Cache] No keys found for prefix: ${prefix}`);
      return 0;
    }

    // Delete in batches to avoid blocking Redis
    const batchSize = 100;
    let deleted = 0;

    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      await delKeys(batch);
      deleted += batch.length;
    }

    logger.info(`[Cache] Cleared ${deleted} keys for prefix: ${prefix}`);
    return deleted;
  } catch (error) {
    logger.error(`[Cache] Clear prefix failed for ${prefix}:`, error);
    return 0;
  }
}

/**
 * Check if cache key exists
 */
export async function cacheExists(
  prefix: string,
  key: string
): Promise<boolean> {
  try {
    validateCacheOptions({ prefix, key });

    const fullKey = buildCacheKey(prefix, key);
    const data = await getKey(fullKey);
    return data !== null;
  } catch (error) {
    logger.error(`[Cache] EXISTS check failed for ${prefix}:${key}:`, error);
    return false;
  }
}
