import { getRequiredEnv, getRequiredNumberEnv } from './env.loader.js';

// JWT
export const jwtConfig = {
  secret: getRequiredEnv('JWT_SECRET'),
  accessExpiresIn: getRequiredNumberEnv('JWT_ACCESS_EXPIRES_IN'),
  refreshExpiresIn: getRequiredNumberEnv('JWT_REFRESH_EXPIRES_IN'),
  issuer: getRequiredEnv('JWT_ISSUER'),
  audience: getRequiredEnv('JWT_AUDIENCE'),
  algorithm: 'HS256' as const,
} as const;

// OAuth
export const oauthConfig = {
  google: {
    clientId: getRequiredEnv('GOOGLE_CLIENT_ID'),
    clientSecret: getRequiredEnv('GOOGLE_CLIENT_SECRET'),
    callbackUrl: getRequiredEnv('GOOGLE_REDIRECT_URI'),
    scope: ['profile', 'email', 'openid'],
  },
} as const;
