import type { PoolConfig } from 'pg';
import { getRequiredEnv, getRequiredNumberEnv } from './env.loader.js';

export const databaseConfig: PoolConfig = {
  connectionString: getRequiredEnv('DATABASE_URL'),
  min: getRequiredNumberEnv('DB_POOL_MIN'),
  max: getRequiredNumberEnv('DB_POOL_MAX'),
  idleTimeoutMillis: getRequiredNumberEnv('DB_IDLE_TIMEOUT'),
  connectionTimeoutMillis: getRequiredNumberEnv('DB_CONNECTION_TIMEOUT'),
} as const;
