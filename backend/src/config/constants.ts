/**
 * Application-wide constants and configuration
 */

export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  DEFAULT_PAGE: 1,
} as const;

export const FILTER_CONFIG = {
  MAX_FILTER_OPERATIONS: 10,
  MAX_FILTER_DEPTH: 3,
} as const;

export const SEARCH_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
} as const;

/**
 * Field mapping for API exposure (external -> internal)
 * This prevents exposing raw database column names
 */
export const USER_FIELD_MAPPING = {
  userId: 'id',
  userName: 'name',
  userEmail: 'email',
  phoneNumber: 'mobile_no',
  userRole: 'role',
  isActive: 'is_active',
  isBanned: 'is_banned',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
} as const;

/**
 * Allowed filter operators
 */
export const FILTER_OPERATORS = [
  'eq',
  'ne',
  'gt',
  'lt',
  'gte',
  'lte',
  'iLike',
  'notILike',
  'inArray',
  'notInArray',
  'in',
  'isEmpty',
  'isNotEmpty',
  'isBetween',
  'isRelativeToToday',
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];
