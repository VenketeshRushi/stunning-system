import { Router } from 'express';
import {
  getUsersController,
  getCurrentUserController,
  updateCurrentUserController,
  getUserByIdController,
  updateUserByIdController,
  deleteUserController,
  restoreUserController,
} from './user.controllers.js';
import {
  getUserByIdParamsSchema,
  getUsersQuerySchema,
  updateUserBodySchema,
  adminUpdateUserBodySchema,
} from './user.schemas.js';
import {
  validateQuery,
  validateBody,
  validateParams,
} from '../../middlewares/validateRequest.middleware.js';
import { rateLimiterMiddleware } from '../../middlewares/rateLimiter.middleware.js';
import { authorizeRolesMiddleware } from '../../middlewares/auth/authorize.middleware.js';
import { authenticateMiddleware } from '../../middlewares/auth/authenticate.middleware.js';

const userRouter: Router = Router();

// ============================================================================
// AUTHENTICATED USER ROUTES (Own Profile)
// ============================================================================

/**
 * @route   GET /api/users/me
 * @desc    Get current authenticated user's profile
 * @access  Private (Authenticated users)
 */
userRouter.get(
  '/me',
  authenticateMiddleware,
  rateLimiterMiddleware('api'),
  getCurrentUserController
);

/**
 * @route   PUT /api/users/me
 * @desc    Update current authenticated user's profile
 * @access  Private (Authenticated users)
 */
userRouter.put(
  '/me',
  authenticateMiddleware,
  rateLimiterMiddleware('api'),
  validateBody(updateUserBodySchema),
  updateCurrentUserController
);

// ============================================================================
// ADMIN ROUTES (Admin/SuperAdmin only)
// ============================================================================

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering, pagination, and search
 * @access  Private (Admin/SuperAdmin only)
 * @example
 *   GET /users?filter[role][eq]=admin
 *   GET /users?filter[is_active][eq]=true&search=john&sort=-created_at
 *   GET /users?filter[role][inArray]=admin,user&limit=50&page=2
 */
userRouter.get(
  '/',
  authenticateMiddleware,
  authorizeRolesMiddleware(['admin', 'superadmin']),
  rateLimiterMiddleware('api'),
  validateQuery(getUsersQuerySchema),
  getUsersController
);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Private (Admin/SuperAdmin only)
 */
userRouter.get(
  '/:userId',
  authenticateMiddleware,
  authorizeRolesMiddleware(['admin', 'superadmin']),
  rateLimiterMiddleware('api'),
  validateParams(getUserByIdParamsSchema),
  getUserByIdController
);

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user by ID (Admin can update role and status)
 * @access  Private (Admin/SuperAdmin only)
 */
userRouter.put(
  '/:userId',
  authenticateMiddleware,
  authorizeRolesMiddleware(['admin', 'superadmin']),
  rateLimiterMiddleware('api'),
  validateParams(getUserByIdParamsSchema),
  validateBody(adminUpdateUserBodySchema),
  updateUserByIdController
);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Soft delete user
 * @access  Private (Admin/SuperAdmin only)
 */
userRouter.delete(
  '/:userId',
  authenticateMiddleware,
  authorizeRolesMiddleware(['admin', 'superadmin']),
  rateLimiterMiddleware('api'),
  validateParams(getUserByIdParamsSchema),
  deleteUserController
);

/**
 * @route   POST /api/users/:userId/restore
 * @desc    Restore soft-deleted user
 * @access  Private (SuperAdmin only)
 */
userRouter.post(
  '/:userId/restore',
  authenticateMiddleware,
  authorizeRolesMiddleware(['superadmin']),
  rateLimiterMiddleware('api'),
  validateParams(getUserByIdParamsSchema),
  restoreUserController
);

export default userRouter;
