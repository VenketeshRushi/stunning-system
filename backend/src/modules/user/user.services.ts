import { eq } from 'drizzle-orm';
import { db } from '../../database/connection.js';
import { usersTable } from '../../models/users.model.js';
import { NotFoundError, ValidationError } from '../../utils/CustomError.js';
import { UserWithoutPassword } from '../../types/auth.types.js';
import { genericSearchService } from '../../services/genericSearch/genericSearch.service.js';
import { ParsedFilter } from '../../services/genericSearch/genericSearch.schema.js';

/**
 * Options for fetching users list
 */
interface GetUsersOptions {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  fields?: string[];
  filter?: ParsedFilter;
  includeDeleted?: boolean;
}

/**
 * Payload for updating user profile
 */
interface UpdateUserPayload {
  name?: string;
  mobile_no?: string | null;
  onboarding?: boolean;
  profession?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  timezone?: string | null;
  language?: string | null;
}

/**
 * Admin update payload (includes role and status fields)
 */
interface AdminUpdateUserPayload extends UpdateUserPayload {
  role?: 'user' | 'admin' | 'superadmin';
  is_active?: boolean;
  is_banned?: boolean;
}

/**
 * Public user columns (excludes sensitive data)
 */
const userPublicColumns = [
  'id',
  'name',
  'email',
  'mobile_no',
  'onboarding',
  'profession',
  'company',
  'address',
  'city',
  'state',
  'country',
  'avatar_url',
  'timezone',
  'language',
  'login_method',
  'role',
  'is_active',
  'is_banned',
  'created_at',
  'updated_at',
] as const;

/**
 * Admin-only columns (sensitive data)
 */
const adminOnlyColumns = ['deleted_at', 'deleted_by'] as const;

/**
 * Get columns visible to a specific role
 */
function getVisibleColumns(userRole: string): readonly string[] {
  if (userRole === 'admin' || userRole === 'superadmin') {
    return [...userPublicColumns, ...adminOnlyColumns];
  }
  return userPublicColumns;
}

/**
 * Get list of users with filtering, pagination, and search
 * @param options - Query options from request
 * @returns Paginated user list
 */
export async function getUsersService(options: GetUsersOptions): Promise<{
  users: UserWithoutPassword[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const {
    page,
    limit,
    search,
    sort,
    fields,
    filter,
    includeDeleted = false,
  } = options;

  try {
    // Default sort order if not specified
    const sortField = sort || '-created_at';

    const result = await genericSearchService<UserWithoutPassword>({
      db,
      table: usersTable,
      columns: userPublicColumns,
      page,
      limit,
      ...(filter !== undefined && { filter }),
      ...(search !== undefined && { search }),
      sort: sortField,
      ...(fields !== undefined && { fields }),
      excludeSoftDeleted: !includeDeleted,
    });

    return {
      users: result.items,
      pagination: result.pagination,
    };
  } catch (error) {
    // Log error for debugging
    console.error('Error fetching users:', error);

    if (error instanceof Error) {
      throw new ValidationError(error.message);
    }

    throw new Error('Failed to fetch users');
  }
}

/**
 * Get user by ID
 * @param userId - User UUID
 * @param requestingUserRole - Role of user making the request
 * @returns User data without password
 */
export async function getUserByIdService(
  userId: string,
  requestingUserRole?: string
): Promise<UserWithoutPassword> {
  try {
    const visibleColumns = requestingUserRole
      ? getVisibleColumns(requestingUserRole)
      : userPublicColumns;

    const selectFields = visibleColumns.reduce((acc: any, col) => {
      if (col in usersTable) {
        acc[col] = usersTable[col as keyof typeof usersTable];
      }
      return acc;
    }, {});

    const [user] = await db
      .select(selectFields)
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user as UserWithoutPassword;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    console.error('Error fetching user by ID:', error);
    throw new Error('Failed to fetch user');
  }
}

/**
 * Update user profile by ID
 * @param userId - User UUID
 * @param payload - Update data
 * @param isAdminUpdate - Whether this is an admin update (allows updating role, status)
 * @returns Updated user data
 */
export async function updateUserByIdService(
  userId: string,
  payload: UpdateUserPayload | AdminUpdateUserPayload,
  isAdminUpdate = false
): Promise<UserWithoutPassword> {
  try {
    // Verify user exists first
    await getUserByIdService(userId);

    // Prevent non-admin updates to sensitive fields
    if (!isAdminUpdate) {
      const adminPayload = payload as AdminUpdateUserPayload;
      if (
        adminPayload.role !== undefined ||
        adminPayload.is_active !== undefined ||
        adminPayload.is_banned !== undefined
      ) {
        throw new ValidationError(
          'You do not have permission to update role or status fields'
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      ...payload,
      updated_at: new Date(),
    };

    const selectFields = userPublicColumns.reduce((acc: any, col) => {
      if (col in usersTable) {
        acc[col] = usersTable[col as keyof typeof usersTable];
      }
      return acc;
    }, {});

    const [updated] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, userId))
      .returning(selectFields);

    if (!updated) {
      throw new NotFoundError('User not found');
    }

    return updated as UserWithoutPassword;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }

    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
}

/**
 * Soft delete user (admin only)
 * @param userId - User UUID to delete
 * @param deletedBy - Admin user ID performing deletion
 */
export async function softDeleteUserService(
  userId: string,
  deletedBy: string
): Promise<void> {
  try {
    const [deleted] = await db
      .update(usersTable)
      .set({
        deleted_at: new Date(),
        deleted_by: deletedBy,
        is_active: false,
        updated_at: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id });

    if (!deleted) {
      throw new NotFoundError('User not found');
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

/**
 * Restore soft-deleted user (admin only)
 * @param userId - User UUID to restore
 */
export async function restoreUserService(userId: string): Promise<void> {
  try {
    const [restored] = await db
      .update(usersTable)
      .set({
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id });

    if (!restored) {
      throw new NotFoundError('User not found');
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    console.error('Error restoring user:', error);
    throw new Error('Failed to restore user');
  }
}
