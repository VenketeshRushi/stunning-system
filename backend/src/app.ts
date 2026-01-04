import express, { Express, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import hpp from 'hpp';
import qs from 'qs';

import { config } from './config/index.js';
import { logger } from './services/logger/index.js';
import { NotFoundError } from './utils/CustomError.js';

import { ensureUploadDirs } from './services/storage/multer.storage.js';

import { helmetMiddleware } from './middlewares/security/helmet.middleware.js';
import { permissionsPolicyMiddleware } from './middlewares/security/permissionsPolicy.middleware.js';
import { corsMiddleware } from './middlewares/security/cors.middleware.js';
import { compressionMiddleware } from './middlewares/performance/compression.middleware.js';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware.js';
import { rateLimiterMiddleware } from './middlewares/rateLimiter.middleware.js';
import { errorHandlerMiddleware } from './middlewares/errorHandler.middleware.js';

import healthRouter from './modules/health/health.routes.js';
import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/user/user.routes.js';

const app: Express = express();

/**
 * Initialize application directories
 */
const initializeDirectories = (): void => {
  const logsDir = path.join(process.cwd(), 'logs');

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logger.info('Created logs directory', { path: logsDir });
  }

  ensureUploadDirs();
};

initializeDirectories();

/**
 * CRITICAL: Advanced query parser
 * Supports:
 * - role=admin,user
 * - role[]=admin&role[]=user
 * - filter[role][inArray]=admin,user
 */
app.set('query parser', (str: string) =>
  qs.parse(str, {
    allowDots: true,
    depth: 10,
    parseArrays: true,
    arrayLimit: 100,
    allowPrototypes: false,
    plainObjects: true,
  })
);

/**
 * Trust proxy (for rate-limit + IP)
 */
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.set('etag', false);

/**
 * SECURITY MIDDLEWARE
 */
app.use(helmetMiddleware);
app.use(permissionsPolicyMiddleware);
app.use(corsMiddleware);

/**
 * REQUEST LOGGING
 */
app.use(requestLoggerMiddleware);

/**
 * RATE LIMITING
 */
app.use(rateLimiterMiddleware('global'));

/**
 * HPP — allow filter nesting
 */
app.use(
  hpp({
    whitelist: [
      'filter',
      'sort',
      'limit',
      'offset',
      'page',
      'fields',
      'search',
      'q',
      'tags',
      'category',
      // 👇 IMPORTANT
      'filter.*',
    ],
  })
);

/**
 * BODY PARSING
 */
const shouldStoreRawBody = (req: Request): boolean =>
  req.path.startsWith('/webhooks/') || req.path.startsWith('/api/webhooks/');

app.use(
  express.json({
    limit: '1mb',
    type: ['application/json', 'application/json-patch+json'],
    verify: (req: Request, _res: Response, buf: Buffer) => {
      // Store raw body for webhook signature verification
      if (shouldStoreRawBody(req)) {
        (req as any).rawBody = buf.toString('utf8');
      }
    },
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '1mb',
    parameterLimit: 100,
  })
);

/**
 * COOKIE PARSING
 */
app.use(cookieParser(config.app.cookieSecret));

/**
 * COMPRESSION
 */
app.use(compressionMiddleware);

app.use((req, _res, next) => {
  const normalize = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      const val = obj[key];

      if (typeof val === 'string' && val.includes(',')) {
        obj[key] = val.split(',').map(v => v.trim());
      } else if (typeof val === 'object') {
        normalize(val);
      }
    }
  };

  normalize(req.query);
  next();
});

/**
 * HEALTH CHECK
 */
app.get('/ping', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

/**
 * ROUTES
 */
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);

/**
 * 404 Handler
 * Catch-all route for unmatched routes
 */
app.get('/{*splat}', (_req: Request, _res: Response) => {
  throw new NotFoundError(
    'The endpoint you requested does not exist on this server.'
  );
});

/**
 * ERROR HANDLER
 * Must be last middleware
 */
app.use(errorHandlerMiddleware);

export default app;
