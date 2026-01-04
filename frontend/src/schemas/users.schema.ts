// src/schemas/users.schema.ts
import { z } from "zod";

/**
 * User schema matching backend response
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  mobile_no: z.string().nullable().optional(),
  role: z.enum(["user", "admin", "superadmin"]),
  login_method: z.enum(["email_password", "google_oauth", "facebook_oauth"]),
  is_active: z.boolean(),
  is_banned: z.boolean(),
  onboarding: z.boolean(),
  profession: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Pagination schema matching backend response
 */
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

/**
 * Filter operators supported by backend
 */
export const filterOperatorSchema = z.enum([
  "eq",
  "ne",
  "gt",
  "lt",
  "gte",
  "lte",
  "iLike",
  "notILike",
  "inArray",
  "notInArray",
  "in",
  "isEmpty",
  "isNotEmpty",
  "isBetween",
  "isRelativeToToday",
]);

/**
 * Filter value types
 */
export const filterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string(), z.number()])),
  z.null(),
]);

/**
 * Single field filter schema
 */
export const fieldFilterSchema = z
  .object({})
  .catchall(filterValueSchema)
  .refine(
    val => {
      return Object.keys(val).every(
        key => filterOperatorSchema.safeParse(key).success
      );
    },
    { message: "All keys must be valid filter operators" }
  );

/**
 * Complete filter schema - NOT optional here, handle at usage site
 */
export const filterSchema = z.record(z.string(), fieldFilterSchema);

/**
 * Update user payload schema
 */
export const updateUserPayloadSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  mobile_no: z.string().max(15).optional(),
  onboarding: z.boolean().optional(),
  profession: z.string().max(100).optional(),
  company: z.string().max(150).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().length(2).optional(),
  avatar_url: z.string().url().max(500).optional(),
});

/**
 * Fetch users params schema
 */
export const fetchUsersParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sort: z.string().optional(),
  search: z.string().min(2).max(100).optional(),
  filter: filterSchema.optional(),
  fields: z.array(z.string()).optional(),
  includeDeleted: z.boolean().optional(),
});

/**
 * Response schemas
 */
export const updateUserResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: userSchema,
});

export const fetchUsersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.object({
    users: z.array(userSchema),
    pagination: paginationSchema,
  }),
});

/**
 * Helper type for filter construction
 */
export type FilterOperator = z.infer<typeof filterOperatorSchema>;
export type FilterValue = z.infer<typeof filterValueSchema>;
export type FieldFilter = Partial<Record<FilterOperator, FilterValue>>;
export type Filter = Record<string, FieldFilter>;

/**
 * Export TypeScript types
 */
export type User = z.infer<typeof userSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type UpdateUserPayload = z.infer<typeof updateUserPayloadSchema>;
export type FetchUsersParams = z.infer<typeof fetchUsersParamsSchema>;
export type UpdateUserResponse = z.infer<typeof updateUserResponseSchema>;
export type FetchUsersResponse = z.infer<typeof fetchUsersResponseSchema>;

/**
 * Helper type for building filters in a type-safe way
 */
export interface FilterBuilder {
  [field: string]: {
    [operator in FilterOperator]?: FilterValue;
  };
}
