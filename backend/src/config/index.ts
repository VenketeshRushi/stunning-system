import { appConfig } from './app.config.js';
import { databaseConfig } from './database.config.js';
import { redisConfig } from './redis.config.js';
import { jwtConfig, oauthConfig } from './auth.config.js';
import { rateLimitConfig } from './rateLimit.config.js';
import { storageConfig } from './storage.config.js';
import { smsConfig } from './sms.config.js';
import { emailConfig } from './email.config.js';
import { llmConfig } from './llm.config.js';

export const config = {
  app: appConfig,
  database: databaseConfig,
  redis: redisConfig,
  sms: smsConfig,
  email: emailConfig,
  storage: storageConfig,
  rateLimit: rateLimitConfig,
  jwt: jwtConfig,
  oauth: oauthConfig,
  llm: llmConfig,
} as const;

console.log('✓ Configuration initialized successfully');
