import type { Request, Response } from 'express';
import { logger } from '../../services/logger/index.js';
import {
  calculateDuration,
  buildLogContext,
  getLogLevel,
  getLogMessage,
  isMonitoringEndpoint,
} from './requestLogger.helpers.js';

/**
 * Log HTTP request with appropriate level and context
 */
export function logRequest(
  req: Request,
  res: Response,
  requestId: string,
  startTime: number
): void {
  const duration = calculateDuration(startTime);
  const logContext = buildLogContext(req, res, requestId, duration);
  const level = getLogLevel(res.statusCode, duration);
  const message = getLogMessage(res.statusCode, duration);

  // Skip logging for monitoring endpoints if desired
  if (isMonitoringEndpoint(req.url)) {
    // Optionally skip or use debug level
    logger.debug(message, logContext);
    return;
  }

  switch (level) {
    case 'error':
      logger.error(message, logContext);
      break;
    case 'warn':
      logger.warn(message, logContext);
      break;
    case 'http':
      logger.http(message, logContext);
      break;
  }
}

/**
 * Create response end interceptor
 * Returns a wrapper function that logs and calls original end
 */
export function createResponseEndInterceptor(
  originalEnd: Response['end'],
  req: Request,
  res: Response,
  requestId: string,
  startTime: number
): Response['end'] {
  let logged = false;

  return function (
    this: Response,
    chunk?: any,
    encodingOrCb?: BufferEncoding | (() => void),
    cb?: () => void
  ): Response {
    // Log only once
    if (!logged) {
      logged = true;
      logRequest(req, res, requestId, startTime);
    }

    // Handle all callback signatures properly
    if (typeof encodingOrCb === 'function') {
      return originalEnd.call(this, chunk, encodingOrCb as any);
    }
    if (typeof cb === 'function') {
      return originalEnd.call(this, chunk, encodingOrCb as BufferEncoding, cb);
    }
    return originalEnd.call(this, chunk, encodingOrCb as BufferEncoding);
  };
}
