/**
 * Rate limit configuration for each endpoint type
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  bypass: boolean;
  failClosed: boolean;
  redisPrefix: string;
  message?: string;
  skipSuccessfulRequests?: boolean;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

/**
 * Current rate limit status information
 */
export interface RateLimitInfo {
  current: number;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Rate limit context for handlers
 */
export interface RateLimitContext {
  key: string;
  limit: number;
  windowMs: number;
  message: string;
  standardHeaders: boolean;
}

/**
 * Rate limit error details
 */
export interface RateLimitErrorDetails {
  limit: number;
  retryAfter: number;
}
