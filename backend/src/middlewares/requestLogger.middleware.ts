import type { Request, Response, NextFunction } from 'express';
import {
  getOrGenerateRequestId,
  setRequestId,
} from './../services/requestLogger/requestLogger.helpers.js';
import { createResponseEndInterceptor } from './../services/requestLogger/requestLogger.handlers.js';

/**
 * Request logger middleware
 *
 * Logs all HTTP requests with:
 * - Request ID (generated or from x-request-id header)
 * - Method, URL, IP, User Agent
 * - Status code and response time
 * - User ID (if authenticated)
 * - Memory usage (for errors and slow requests)
 *
 * Log levels:
 * - error: 5xx status codes
 * - warn: 4xx status codes or slow requests (>1s)
 * - http: all other requests
 *
 * @example
 * app.use(requestLoggerMiddleware);
 */
export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log('requestLoggerMiddleware');
  const startTime = Date.now();

  // Generate or retrieve request ID
  const requestId = getOrGenerateRequestId(req);
  console.log('requestId', requestId);
  setRequestId(req, res, requestId);

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to log after response is sent
  res.end = createResponseEndInterceptor(
    originalEnd,
    req,
    res,
    requestId,
    startTime
  );

  next();
};
