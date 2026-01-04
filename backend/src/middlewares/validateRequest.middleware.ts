import { ApiError } from './../utils/ApiError.js';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ZodType } from 'zod';

/**
 * Schema map for request validation
 */
type SchemaMap = {
  body?: ZodType<any, any>;
  headers?: ZodType<any, any>;
  query?: ZodType<any, any>;
  params?: ZodType<any, any>;
};

/**
 * Validate request against Zod schemas
 *
 * Validates in order: headers -> params -> query -> body
 * This ensures authentication/authorization happens before validating payload
 *
 * @param schemas - Object containing schemas for different parts of the request
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.post('/users',
 *   validateRequest({
 *     body: createUserSchema,
 *     headers: authHeadersSchema
 *   }),
 *   createUserController
 * );
 * ```
 *
 * @note This middleware stores validated data in separate properties
 * (validatedBody, validatedQuery, etc.) to avoid mutating read-only properties
 */
export function validateRequest(schemas: SchemaMap) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Validate headers first (authentication/authorization)
      if (schemas.headers) {
        const result = schemas.headers.safeParse(req.headers);
        if (!result.success) {
          throw result.error;
        }
        req.validatedHeaders = result.data;
      }

      // Validate route parameters
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          throw result.error;
        }
        req.validatedParams = result.data;
        req.params = result.data; // Backward compatibility (writable)
      }

      // Validate query parameters
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          throw result.error;
        }
        req.validatedQuery = result.data; // query is read-only
      }

      // Validate request body last
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          throw result.error;
        }
        req.validatedBody = result.data;
        req.body = result.data; // Backward compatibility (writable)
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(ApiError.fromZodError(err));
      }
      return next(err);
    }
  };
}

/**
 * Validate only request body
 *
 * @param schema - Zod schema for request body
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.post('/users', validateBody(createUserSchema), createUser);
 * ```
 */
export function validateBody<T>(schema: ZodType<T>) {
  return validateRequest({ body: schema });
}

/**
 * Validate only query parameters
 *
 * @param schema - Zod schema for query parameters
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.get('/users', validateQuery(listUsersQuerySchema), listUsers);
 * ```
 */
export function validateQuery<T>(schema: ZodType<T>) {
  return validateRequest({ query: schema });
}

/**
 * Validate only route parameters
 *
 * @param schema - Zod schema for route parameters
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.get('/users/:id', validateParams(userIdSchema), getUser);
 * ```
 */
export function validateParams<T>(schema: ZodType<T>) {
  return validateRequest({ params: schema });
}

/**
 * Validate only request headers
 *
 * @param schema - Zod schema for request headers
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.post('/webhook', validateHeaders(webhookHeadersSchema), handleWebhook);
 * ```
 */
export function validateHeaders<T>(schema: ZodType<T>) {
  return validateRequest({ headers: schema });
}
