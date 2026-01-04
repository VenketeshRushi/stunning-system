import * as express from 'express';

/**
 * User information attached to authenticated requests
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  onboarding: boolean;
  avatar_url: string | null;
  is_banned: boolean;
  is_active: boolean;
}

/**
 * Cache information stored in response locals
 */
export interface CacheLocals {
  cacheKey?: string;
  cachePrefix?: string;
  cacheTTL?: number;
  cacheInfo?: {
    prefix: string;
    key: string;
    ttl: number;
  };
  cacheInvalidate?: {
    prefix: string;
    keys?: string[];
    clearAll?: boolean;
  };
}

declare global {
  namespace Express {
    interface Request {
      /**
       * Unique request identifier
       * Generated automatically or from x-request-id header
       */
      id?: string;

      /**
       * Authenticated user information
       * Set by authentication middleware
       */
      user?: AuthenticatedUser;

      /**
       * Raw request body buffer
       * Used for webhook signature verification
       */
      rawBody?: Buffer;

      /**
       * Validated request body (from Zod validation)
       */
      validatedBody?: unknown;

      /**
       * Validated query parameters (from Zod validation)
       */
      validatedQuery?: unknown;

      /**
       * Validated route parameters (from Zod validation)
       */
      validatedParams?: unknown;

      /**
       * Validated headers (from Zod validation)
       */
      validatedHeaders?: unknown;
    }

    interface Response {
      /**
       * Response locals for middleware communication
       */
      locals: CacheLocals & {
        [key: string]: any;
      };
    }
  }
}

export {};
