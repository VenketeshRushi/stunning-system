import type { Request, Response } from 'express';
import { getClientIp, sanitizeUrl } from '../../utils/ext.js';
import { generateUUID } from '../../utils/encryption.js';
import type {
  LogContext,
  LogLevel,
  MemoryUsage,
} from './requestLogger.types.js';

/**
 * Thresholds for special logging
 */
export const LOG_THRESHOLDS = {
  SLOW_REQUEST_MS: 1000,
  CLIENT_ERROR_STATUS: 400,
  SERVER_ERROR_STATUS: 500,
} as const;

/**
 * Generate or retrieve request ID
 */
export function getOrGenerateRequestId(req: Request): string {
  return req.id || (req.headers['x-request-id'] as string) || generateUUID();
}

/**
 * Set request ID on request and response
 */
export function setRequestId(
  req: Request,
  res: Response,
  requestId: string
): void {
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
}

/**
 * Calculate request duration in milliseconds
 */
export function calculateDuration(startTime: number): number {
  return Date.now() - startTime;
}

/**
 * Get current memory usage in MB
 */
export function getMemoryUsageMB(): number {
  return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
}

/**
 * Get detailed memory usage
 */
export function getDetailedMemoryUsage(): MemoryUsage {
  const usage = process.memoryUsage();
  return {
    heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
    externalMB: Math.round(usage.external / 1024 / 1024),
    rss: Math.round(usage.rss / 1024 / 1024),
  };
}

/**
 * Check if request should track memory usage
 * Only track on errors or slow requests to reduce overhead
 */
export function shouldTrackMemory(
  statusCode: number,
  duration: number
): boolean {
  return (
    statusCode >= LOG_THRESHOLDS.CLIENT_ERROR_STATUS ||
    duration > LOG_THRESHOLDS.SLOW_REQUEST_MS
  );
}

/**
 * Determine log level based on status code and duration
 */
export function getLogLevel(statusCode: number, duration: number): LogLevel {
  if (statusCode >= LOG_THRESHOLDS.SERVER_ERROR_STATUS) {
    return 'error';
  }
  if (
    statusCode >= LOG_THRESHOLDS.CLIENT_ERROR_STATUS ||
    duration > LOG_THRESHOLDS.SLOW_REQUEST_MS
  ) {
    return 'warn';
  }
  return 'http';
}

/**
 * Get log message based on status code and duration
 */
export function getLogMessage(statusCode: number, duration: number): string {
  if (statusCode >= LOG_THRESHOLDS.SERVER_ERROR_STATUS) {
    return 'HTTP Request - Server Error';
  }
  if (statusCode >= LOG_THRESHOLDS.CLIENT_ERROR_STATUS) {
    return 'HTTP Request - Client Error';
  }
  if (duration > LOG_THRESHOLDS.SLOW_REQUEST_MS) {
    return 'HTTP Request - Slow Response';
  }
  return 'HTTP Request';
}

/**
 * Build log context from request and response
 */
export function buildLogContext(
  req: Request,
  res: Response,
  requestId: string,
  duration: number
): LogContext {
  const statusCode = res.statusCode;

  const context: LogContext = {
    requestId,
    method: req.method,
    url: sanitizeUrl(req.originalUrl || req.url),
    ip: getClientIp(req),
    statusCode,
    duration,
    error: statusCode >= LOG_THRESHOLDS.CLIENT_ERROR_STATUS,
    timestamp: new Date().toISOString(),
  };

  // Add optional fields
  const userAgent = req.get('user-agent');
  const contentLength = res.get('content-length');
  const userId = req.user?.id;

  if (userAgent) context.userAgent = userAgent;
  if (contentLength) context.contentLength = contentLength;
  if (userId) context.userId = userId;

  // Add memory usage for errors or slow requests
  if (shouldTrackMemory(statusCode, duration)) {
    context.memoryUsageMB = getMemoryUsageMB();
  }

  return context;
}

/**
 * Check if request is a health check or monitoring endpoint
 */
export function isMonitoringEndpoint(url: string): boolean {
  const monitoringPaths = ['/health', '/ping', '/metrics', '/status'];
  return monitoringPaths.some(path => url.startsWith(path));
}
