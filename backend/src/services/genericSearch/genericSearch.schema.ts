/* src/schemas/genericSearch.schema.ts */
import { z } from 'zod';
import {
  PAGINATION_CONFIG,
  FILTER_CONFIG,
  SEARCH_CONFIG,
  FILTER_OPERATORS,
} from '../../config/constants.js';

const ARRAY_OPERATORS = ['inArray', 'in', 'notInArray', 'isBetween'] as const;

/**
 * Coerce primitive-like strings to proper types where possible
 * - "123" -> 123
 * - "12.34" -> 12.34
 * - "true" / "false" -> boolean
 * - otherwise keep string
 */
function coercePrimitive(val: any): string | number | boolean | null {
  if (val === null || val === undefined) return val;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val;

  if (typeof val !== 'string') return val;

  const trimmed = val.trim();
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;

  // integer
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  // float
  if (/^-?\d+\.\d+$/.test(trimmed)) return Number(trimmed);

  return trimmed;
}

/**
 * Normalize value coming from Express query parser:
 * - arrays stay arrays (but elements coerced)
 * - comma separated strings -> arrays for array-operators
 * - single-element array used as single value for non-array operators (handled later)
 */
function normalizeRawValue(raw: any, operator: string) {
  // If already an array: coerce each element
  if (Array.isArray(raw)) {
    return raw.map(coercePrimitive);
  }

  // If string with commas and operator expects array -> split
  if (
    typeof raw === 'string' &&
    raw.includes(',') &&
    ARRAY_OPERATORS.includes(operator as any)
  ) {
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(coercePrimitive);
  }

  // Single primitive value -> coerce
  return coercePrimitive(raw);
}

/**
 * Filter value schema after coercion
 * Accepts:
 *  - string (<=255)
 *  - number
 *  - boolean
 *  - array of strings/numbers/booleans (max 100)
 *  - null
 */
const filterValueSchema = z.union([
  z.string().max(255),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string().max(255), z.number(), z.boolean()])).max(100),
  z.null(),
]);

/**
 * fieldFilterSchema: expects keys to be valid operators and coerces/normalizes values
 * We use a preprocess to normalize values coming from Express query parser.
 */
const fieldFilterSchema = z.preprocess(
  (rawObj: any) => {
    if (rawObj === undefined || rawObj === null) return rawObj;
    if (typeof rawObj !== 'object') return rawObj;

    const normalized: Record<string, any> = {};
    for (const [operator, val] of Object.entries(rawObj)) {
      // Normalize value based on operator
      normalized[operator] = normalizeRawValue(val, operator);
    }
    return normalized;
  },
  z.record(
    z.enum(FILTER_OPERATORS as unknown as [string, ...string[]]),
    filterValueSchema
  )
);

export const baseSearchSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(PAGINATION_CONFIG.MIN_LIMIT)
    .default(PAGINATION_CONFIG.DEFAULT_PAGE)
    .catch(PAGINATION_CONFIG.DEFAULT_PAGE),

  limit: z.coerce
    .number()
    .int()
    .min(PAGINATION_CONFIG.MIN_LIMIT)
    .max(PAGINATION_CONFIG.MAX_LIMIT)
    .default(PAGINATION_CONFIG.DEFAULT_LIMIT)
    .catch(PAGINATION_CONFIG.DEFAULT_LIMIT),

  sort: z
    .string()
    .regex(/^-?[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid sort format')
    .max(50)
    .optional(),

  search: z
    .string()
    .min(SEARCH_CONFIG.MIN_SEARCH_LENGTH)
    .max(SEARCH_CONFIG.MAX_SEARCH_LENGTH)
    .optional()
    .transform(val => val?.trim()),

  filter: z
    .record(z.string().max(50), fieldFilterSchema)
    .optional()
    .refine(
      filter => {
        if (!filter) return true;
        const totalOps = Object.values(filter).reduce(
          (sum, ops) => sum + Object.keys(ops).length,
          0
        );
        return totalOps <= FILTER_CONFIG.MAX_FILTER_OPERATIONS;
      },
      {
        message: `Too many filter operations (max ${FILTER_CONFIG.MAX_FILTER_OPERATIONS})`,
      }
    )
    .refine(
      filter => {
        if (!filter) return true;
        return Object.keys(filter).every(key =>
          /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)
        );
      },
      { message: 'Invalid field name in filter' }
    ),

  fields: z
    .union([z.string().max(500), z.array(z.string())])
    .optional()
    .transform(val => {
      if (!val) return undefined;
      return Array.isArray(val)
        ? val
        : val
            .split(',')
            .map(f => f.trim())
            .filter(Boolean);
    }),
});

export type BaseSearchSchema = z.infer<typeof baseSearchSchema>;

export interface ParsedFilter {
  [field: string]: {
    [operator: string]: any;
  };
}
