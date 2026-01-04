/**
 * Log context for HTTP requests
 */
export interface LogContext {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  statusCode: number;
  duration: number;
  contentLength?: string;
  userId?: string;
  error?: boolean;
  memoryUsageMB?: number;
  timestamp: string;
}

/**
 * Request timing information
 */
export interface RequestTiming {
  startTime: number;
  endTime?: number;
  duration?: number;
}

/**
 * Log level based on status code
 */
export type LogLevel = 'http' | 'warn' | 'error';

/**
 * Memory usage information
 */
export interface MemoryUsage {
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  rss: number;
}
