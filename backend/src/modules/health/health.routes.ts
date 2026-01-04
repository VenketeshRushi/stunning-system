import { Router } from 'express';
import { healthCheckController } from './health.controller.js';
import { rateLimiterMiddleware } from '../../middlewares/rateLimiter.middleware.js';
import { cacheMiddleware } from '../../middlewares/performance/cache.middleware.js';

const healthRouter: Router = Router();

healthRouter.get(
  '/',
  rateLimiterMiddleware('health'),
  cacheMiddleware({ prefix: 'health', ttl: 10 }),
  healthCheckController
);

export default healthRouter;
