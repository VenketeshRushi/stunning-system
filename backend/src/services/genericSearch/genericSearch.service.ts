import {
  and,
  desc,
  asc,
  ilike,
  or,
  count,
  not,
  isNull,
  isNotNull,
  between,
  SQL,
  eq,
  gt,
  lt,
  gte,
  lte,
  inArray,
  ne,
} from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { ParsedFilter } from './genericSearch.schema.js';

function sanitizeSearchString(search: string): string {
  return search.replace(/[%_]/g, '\\$&');
}

function parseRelativeDate(value: string) {
  const match = value.match(/^(last|next)\s+(\d+)\s+(day|week|month)s?$/i);
  if (!match) return null;
  const [, direction, amount, unit] = match;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let days = parseInt(amount!, 10);
  if (unit === 'week') days *= 7;
  if (unit === 'month') days *= 30;

  if (direction === 'last') {
    const start = new Date(today);
    start.setDate(start.getDate() - days);
    return { start, end: today };
  } else {
    const end = new Date(today);
    end.setDate(end.getDate() + days);
    return { start: today, end };
  }
}

const ARRAY_OPS = ['inArray', 'in', 'notInArray', 'isBetween'];

export function parseFilters(
  table: any,
  filters: ParsedFilter | undefined,
  allowedColumns: Set<string>
): SQL[] {
  const conditions: SQL[] = [];
  if (!filters) return conditions;

  for (const field in filters) {
    if (!allowedColumns.has(field)) {
      throw new Error(`Invalid filter field: ${field}`);
    }

    if (!(field in table)) {
      throw new Error(`Field does not exist in table: ${field}`);
    }

    const ops = filters[field];

    for (const op in ops) {
      let rawValue = ops[op];

      if (rawValue === undefined || rawValue === null) continue;

      // If parser returned an array for a non-array operator, use the first element
      if (Array.isArray(rawValue) && !ARRAY_OPS.includes(op)) {
        rawValue = rawValue.length > 0 ? rawValue[0] : undefined;
      }

      if (rawValue === undefined || rawValue === null) continue;

      try {
        switch (op) {
          case 'eq':
            conditions.push(eq(table[field], rawValue));
            break;

          case 'ne':
            conditions.push(ne(table[field], rawValue));
            break;

          case 'gt':
            conditions.push(gt(table[field], rawValue));
            break;

          case 'lt':
            conditions.push(lt(table[field], rawValue));
            break;

          case 'gte':
            conditions.push(gte(table[field], rawValue));
            break;

          case 'lte':
            conditions.push(lte(table[field], rawValue));
            break;

          case 'iLike':
            conditions.push(
              ilike(table[field], `%${sanitizeSearchString(String(rawValue))}%`)
            );
            break;

          case 'notILike':
            conditions.push(
              not(
                ilike(
                  table[field],
                  `%${sanitizeSearchString(String(rawValue))}%`
                )
              )
            );
            break;

          case 'inArray':
          case 'in': {
            const vals = Array.isArray(rawValue)
              ? rawValue
              : String(rawValue)
                  .split(',')
                  .map(v => v.trim())
                  .filter(Boolean);
            if (vals.length === 0) break;
            conditions.push(inArray(table[field], vals));
            break;
          }

          case 'notInArray': {
            const notVals = Array.isArray(rawValue)
              ? rawValue
              : String(rawValue)
                  .split(',')
                  .map(v => v.trim())
                  .filter(Boolean);
            if (notVals.length === 0) break;
            conditions.push(not(inArray(table[field], notVals)));
            break;
          }

          case 'isEmpty':
            conditions.push(isNull(table[field]));
            break;

          case 'isNotEmpty':
            conditions.push(isNotNull(table[field]));
            break;

          case 'isBetween': {
            const range = Array.isArray(rawValue)
              ? rawValue
              : String(rawValue)
                  .split(',')
                  .map(v => v.trim());
            if (range.length !== 2) {
              throw new Error(`Invalid range for isBetween: ${rawValue}`);
            }
            const a = Number(range[0]);
            const b = Number(range[1]);
            if (Number.isNaN(a) || Number.isNaN(b)) {
              throw new Error(
                `Invalid numeric range for isBetween: ${rawValue}`
              );
            }
            conditions.push(between(table[field], a, b));
            break;
          }

          case 'isRelativeToToday': {
            const dateRange = parseRelativeDate(String(rawValue));
            if (!dateRange) {
              throw new Error(
                `Invalid relative date format: "${rawValue}". Use: "last 7 days" or "next 30 days"`
              );
            }
            conditions.push(
              between(table[field], dateRange.start, dateRange.end)
            );
            break;
          }

          default:
            throw new Error(`Unsupported filter operator: ${op}`);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        throw new Error(
          `Error parsing filter for field "${field}": ${errorMessage}`
        );
      }
    }
  }

  return conditions;
}

export async function genericSearchService<T extends Record<string, any>>({
  db,
  table,
  columns,
  search,
  filter,
  page,
  limit,
  sort,
  fields,
  excludeSoftDeleted = true,
}: {
  db: PostgresJsDatabase<any>;
  table: PgTable;
  columns: readonly string[];
  search?: string;
  filter?: ParsedFilter;
  page: number;
  limit: number;
  sort?: string;
  fields?: string[];
  excludeSoftDeleted?: boolean;
}): Promise<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [];
  const allowedColumns = new Set(columns);

  if (excludeSoftDeleted && 'deleted_at' in table) {
    conditions.push(isNull((table as any).deleted_at));
  }

  if (filter) {
    const filterConditions = parseFilters(table, filter, allowedColumns);
    conditions.push(...filterConditions);
  }

  if (search) {
    const sanitizedSearch = sanitizeSearchString(search);
    const searchableColumns = columns.filter(
      col => col in table && typeof (table as any)[col] !== 'undefined'
    );
    if (searchableColumns.length > 0) {
      const searchConditions = searchableColumns.map(col =>
        ilike((table as any)[col], `%${sanitizedSearch}%`)
      );
      conditions.push(or(...searchConditions)!);
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let selectedColumns = [...columns];
  if (fields && fields.length > 0) {
    selectedColumns = fields.filter(f => allowedColumns.has(f));
    if (selectedColumns.length === 0) {
      throw new Error('No valid fields specified');
    }
  }

  const selectFields = selectedColumns.reduce((acc: any, col: string) => {
    if (col in table) acc[col] = (table as any)[col];
    return acc;
  }, {});

  let query = db
    .select(selectFields)
    .from(table)
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  if (sort) {
    const isDescending = sort.startsWith('-');
    const sortField = isDescending ? sort.slice(1) : sort;
    if (!allowedColumns.has(sortField)) {
      throw new Error(`Invalid sort field: ${sortField}`);
    }
    if (sortField in table) {
      query = query.orderBy(
        isDescending
          ? desc((table as any)[sortField])
          : asc((table as any)[sortField])
      ) as any;
    }
  }

  try {
    const [items, totalResult] = await Promise.all([
      query,
      db.select({ count: count() }).from(table).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      items: items as T[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error('Failed to fetch data from database');
  }
}
