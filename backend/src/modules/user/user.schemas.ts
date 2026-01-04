import { z } from 'zod';
import { baseSearchSchema } from '../../services/genericSearch/genericSearch.schema.js';

/**
 * Schema for getting list of users
 */
export const getUsersQuerySchema = baseSearchSchema.extend({
  includeDeleted: z
    .union([z.enum(['true', 'false']), z.boolean()])
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .optional(),
});

/**
 * Schema for getting user by ID
 */
export const getUserByIdParamsSchema = z.object({
  userId: z
    .string()
    .uuid({ message: 'Invalid user ID format. Must be a valid UUID.' }),
});

/**
 * Base update shape without refine
 * (so it can be extended safely)
 */
const updateUserBaseShape = {
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be less than 100 characters')
    .optional(),

  mobile_no: z
    .string()
    .max(15, 'Mobile number must be less than 15 characters')
    .regex(/^\+?[0-9\s-()]+$/, 'Invalid mobile number format')
    .optional()
    .nullable(),

  onboarding: z.boolean().optional(),

  profession: z
    .string()
    .max(100, 'Profession must be less than 100 characters')
    .optional()
    .nullable(),

  company: z
    .string()
    .max(150, 'Company name must be less than 150 characters')
    .optional()
    .nullable(),

  address: z
    .string()
    .max(255, 'Address must be less than 255 characters')
    .optional()
    .nullable(),

  city: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .nullable(),

  state: z
    .string()
    .max(100, 'State must be less than 100 characters')
    .optional()
    .nullable(),

  country: z
    .string()
    .max(100, 'Country must be less than 100 characters')
    .optional()
    .nullable(),

  timezone: z
    .string()
    .max(50, 'Timezone must be less than 50 characters')
    .optional()
    .nullable(),

  language: z
    .string()
    .length(2, 'Language code must be 2 characters (ISO 639-1)')
    .regex(/^[a-z]{2}$/, 'Invalid language code format')
    .optional()
    .nullable(),

  avatar_url: z
    .string()
    .url({ message: 'Invalid URL format for avatar' })
    .max(500, 'Avatar URL must be less than 500 characters')
    .optional()
    .nullable(),
};

/**
 * Schema for updating user profile
 */
export const updateUserBodySchema = z
  .object(updateUserBaseShape)
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Admin update schema
 * — includes extra fields
 */
export const adminUpdateUserBodySchema = z
  .object({
    ...updateUserBaseShape,
    role: z
      .enum(['user', 'admin', 'superadmin'], {
        message: 'Invalid role. Must be: user, admin, or superadmin',
      })
      .optional(),

    is_active: z.boolean().optional(),
    is_banned: z.boolean().optional(),
  })
  .strict()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Types
 */
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type GetUserByIdParams = z.infer<typeof getUserByIdParamsSchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type AdminUpdateUserBody = z.infer<typeof adminUpdateUserBodySchema>;
