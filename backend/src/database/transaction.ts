import type { NodePgTransaction } from 'drizzle-orm/node-postgres';
import { db } from './connection.js';
import { logger } from '../services/logger/index.js';

export const withTransaction = async <T>(
  callback: (tx: NodePgTransaction<any, any>) => Promise<T>
): Promise<T> => {
  try {
    return await db.transaction(callback);
  } catch (error) {
    logger.error('Database transaction failed', error);
    throw error;
  }
};
