import { config } from '../config/index.js';
import { logger } from '../services/logger/index.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, DatabaseError } from 'pg';
import { Logger as DrizzleLogger } from 'drizzle-orm/logger';

class WinstonDrizzleLogger implements DrizzleLogger {
  logQuery(query: string, params: unknown[]): void {
    logger.debug('Drizzle SQL query', { query, params });
  }
}

const pool = new Pool(config.database);

pool.on('connect', () => logger.info('PostgreSQL connected'));
pool.on('error', err => {
  const e = err as DatabaseError;
  logger.error('PostgreSQL pool error', {
    message: e.message,
    code: e.code,
    stack: config.app.nodeEnv === 'development' ? e.stack : undefined,
  });
});

export const shutdownPool = async (): Promise<void> => {
  logger.info('Closing PostgreSQL pool...');
  await pool.end();
};

const drizzleLogger =
  config.app.nodeEnv === 'development' ? new WinstonDrizzleLogger() : false;

export const db = drizzle(pool, { logger: drizzleLogger });
export { pool };
