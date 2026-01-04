import { getRequiredEnv, getRequiredNumberEnv } from './env.loader.js';

export const appConfig = {
  nodeEnv: getRequiredEnv('NODE_ENV'),
  port: getRequiredNumberEnv('PORT'),
  host: getRequiredEnv('HOST'),
  backendUrl: getRequiredEnv('BACKEND_URL'),
  frontendUrl: getRequiredEnv('FRONTEND_URL'),
  allowedOrigin: getRequiredEnv('ALLOWED_ORIGIN'),
  logLevel: getRequiredEnv('LOG_LEVEL'),
  cookieSecret: getRequiredEnv('COOKIE_SECRET'),
} as const;

console.log('appConfig', appConfig);
