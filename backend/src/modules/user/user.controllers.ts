import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response.js';
import {
  getUsersService,
  getUserByIdService,
  updateUserByIdService,
  softDeleteUserService,
  restoreUserService,
} from './user.services.js';
import {
  GetUsersQuery,
  GetUserByIdParams,
  UpdateUserBody,
  AdminUpdateUserBody,
} from './user.schemas.js';

/**
 * Helper function to remove undefined properties from an object
 * Required for exactOptionalPropertyTypes: true
 */
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Get current authenticated user's profile
 * @route GET /api/users/me
 */
export async function getCurrentUserController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const user = await getUserByIdService(userId);

    sendSuccess(res, user, {
      message: 'User profile fetched successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update current authenticated user's profile
 * @route PUT /api/users/me
 */
export async function updateCurrentUserController(
  req: Request<{}, {}, UpdateUserBody>,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    // Filter out undefined properties to satisfy exactOptionalPropertyTypes
    const payload = removeUndefined(req.body) as any;
    const user = await updateUserByIdService(userId, payload, false);

    sendSuccess(res, user, {
      message: 'User profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user by ID (Admin only)
 * @route GET /api/users/:userId
 */
export async function getUserByIdController(
  req: Request<GetUserByIdParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;
    const requestingUserRole = req.user?.role;

    const user = await getUserByIdService(userId, requestingUserRole);

    sendSuccess(res, user, {
      message: 'User fetched successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all users with advanced filters (Admin only)
 * @route GET /api/users
 */
export async function getUsersController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log(req.query);
    const query = req.validatedQuery as GetUsersQuery;
    const result = await getUsersService({
      page: query.page || 1,
      limit: query.limit || 20,
      ...(query.search !== undefined && { search: query.search }),
      ...(query.sort !== undefined && { sort: query.sort }),
      ...(query.fields !== undefined && { fields: query.fields }),
      ...(query.filter !== undefined && { filter: query.filter }),
      ...(query.includeDeleted !== undefined && {
        includeDeleted: query.includeDeleted,
      }),
    });

    sendSuccess(res, result, {
      message: 'Users fetched successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user by ID (Admin only)
 * @route PUT /api/users/:userId
 */
export async function updateUserByIdController(
  req: Request<GetUserByIdParams, {}, AdminUpdateUserBody>,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;
    const isAdmin =
      req.user?.role === 'admin' || req.user?.role === 'superadmin';

    // Filter out undefined properties to satisfy exactOptionalPropertyTypes
    const payload = removeUndefined(req.body) as any;
    const user = await updateUserByIdService(userId, payload, isAdmin);

    sendSuccess(res, user, {
      message: 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Soft delete user (Admin only)
 * @route DELETE /api/users/:userId
 */
export async function deleteUserController(
  req: Request<GetUserByIdParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;
    const adminId = req.user!.id;

    await softDeleteUserService(userId, adminId);

    sendSuccess(res, null, {
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Restore soft-deleted user (Admin only)
 * @route POST /api/users/:userId/restore
 */
export async function restoreUserController(
  req: Request<GetUserByIdParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;

    await restoreUserService(userId);

    sendSuccess(res, null, {
      message: 'User restored successfully',
    });
  } catch (error) {
    next(error);
  }
}
