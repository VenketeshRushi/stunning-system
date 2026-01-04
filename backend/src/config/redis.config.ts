import type { RedisOptions } from 'ioredis';
import { getRequiredEnv, getRequiredNumberEnv } from './env.loader.js';

export const redisConfig: RedisOptions = {
  port: getRequiredNumberEnv('REDIS_PORT'),
  host: getRequiredEnv('REDIS_HOST'),
  password: getRequiredEnv('REDIS_PASSWORD'),
  username: getRequiredEnv('REDIS_USERNAME'),
} as const;
