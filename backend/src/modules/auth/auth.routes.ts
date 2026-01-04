import { Router } from 'express';
import {
  googleAuthCodeController,
  refreshTokenController,
  logoutController,
  logoutAllDevicesController,
} from './auth.controllers.js';
import { rateLimiterMiddleware } from '../../middlewares/rateLimiter.middleware.js';
import { authenticateMiddleware } from '../../middlewares/auth/authenticate.middleware.js';

const authRouter: Router = Router();

// Google OAuth 2.0 With PKCE
authRouter.post(
  '/google/callback',
  rateLimiterMiddleware('auth'),
  googleAuthCodeController
);

// Refresh token
authRouter.post(
  '/refresh',
  rateLimiterMiddleware('auth'),
  refreshTokenController
);

// Logout (protected)
authRouter.post(
  '/logout',
  authenticateMiddleware,
  rateLimiterMiddleware('auth'),
  logoutController
);

// Logout all devices
authRouter.post(
  '/logout/all',
  authenticateMiddleware,
  rateLimiterMiddleware('auth'),
  logoutAllDevicesController
);

export default authRouter;
