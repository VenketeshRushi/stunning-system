import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  ColumnFiltersState,
  SortingState,
  PaginationState,
} from "@tanstack/react-table";

/* =========================
   URL Param Keys
========================= */
const PARAM_KEYS = {
  PAGE: "page",
  PAGE_SIZE: "limit",
  SORT: "sort",
  FILTER_PREFIX: "filter",
} as const;

/* =========================
   Serialization Helpers
========================= */

/**
 * Serialize filter value to URL-safe string
 */
function serializeFilterValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  // Handle date ranges
  if (typeof value === "object" && value !== null && "from" in value) {
    const range = value as { from?: Date; to?: Date };
    const from = range.from ? range.from.toISOString() : "";
    const to = range.to ? range.to.toISOString() : "";
    return `${from}~${to}`;
  }

  // Handle arrays (multiselect)
  if (Array.isArray(value)) {
    return value.join(",");
  }

  return String(value);
}

/**
 * Deserialize filter value from URL string
 */
function deserializeFilterValue(value: string, filterId: string): unknown {
  if (!value) return undefined;

  // Handle date ranges (contains ~)
  if (value.includes("~") && filterId === "created_at") {
    const [from, to] = value.split("~");
    return {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
  }

  // Handle boolean
  if (value === "true") return true;
  if (value === "false") return false;

  // Handle CSV (multiselect) - keep as string, tanstack handles it
  if (value.includes(",")) {
    return value; // Return as CSV string
  }

  return value;
}

/* =========================
   Main Hook
========================= */

interface UseUrlFilterStateReturn {
  pagination: PaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  setPagination: (
    updater: PaginationState | ((old: PaginationState) => PaginationState)
  ) => void;
  setSorting: (
    updater: SortingState | ((old: SortingState) => SortingState)
  ) => void;
  setColumnFilters: (
    updater:
      | ColumnFiltersState
      | ((old: ColumnFiltersState) => ColumnFiltersState)
  ) => void;
  resetFilters: () => void;
  isFiltered: boolean;
}

export function useUrlFilterState(
  defaultPageSize: number = 10
): UseUrlFilterStateReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  /* =========================
     Parse State from URL
  ========================= */

  const pagination = useMemo<PaginationState>(() => {
    const page = searchParams.get(PARAM_KEYS.PAGE);
    const limit = searchParams.get(PARAM_KEYS.PAGE_SIZE);

    return {
      pageIndex: page ? Math.max(0, parseInt(page) - 1) : 0,
      pageSize: limit ? parseInt(limit) : defaultPageSize,
    };
  }, [searchParams, defaultPageSize]);

  const sorting = useMemo<SortingState>(() => {
    const sort = searchParams.get(PARAM_KEYS.SORT);
    if (!sort) return [];

    const isDesc = sort.startsWith("-");
    const id = isDesc ? sort.slice(1) : sort;

    return [{ id, desc: isDesc }];
  }, [searchParams]);

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];

    searchParams.forEach((value, key) => {
      if (key.startsWith(`${PARAM_KEYS.FILTER_PREFIX}.`)) {
        const filterId = key.replace(`${PARAM_KEYS.FILTER_PREFIX}.`, "");
        const deserializedValue = deserializeFilterValue(value, filterId);

        if (deserializedValue !== undefined) {
          filters.push({ id: filterId, value: deserializedValue });
        }
      }
    });

    return filters;
  }, [searchParams]);

  const isFiltered = columnFilters.length > 0;

  /* =========================
     Update URL
  ========================= */

  const updateUrl = useCallback(
    (updates: {
      pagination?: PaginationState;
      sorting?: SortingState;
      columnFilters?: ColumnFiltersState;
    }) => {
      setSearchParams(
        prev => {
          const newParams = new URLSearchParams(prev);

          // Update pagination
          if (updates.pagination) {
            const { pageIndex, pageSize } = updates.pagination;
            if (pageIndex === 0) {
              newParams.delete(PARAM_KEYS.PAGE);
            } else {
              newParams.set(PARAM_KEYS.PAGE, String(pageIndex + 1));
            }

            if (pageSize === defaultPageSize) {
              newParams.delete(PARAM_KEYS.PAGE_SIZE);
            } else {
              newParams.set(PARAM_KEYS.PAGE_SIZE, String(pageSize));
            }
          }

          // Update sorting
          if (updates.sorting !== undefined) {
            if (updates.sorting.length === 0) {
              newParams.delete(PARAM_KEYS.SORT);
            } else {
              const sort = updates.sorting[0];
              const sortValue = sort.desc ? `-${sort.id}` : sort.id;
              newParams.set(PARAM_KEYS.SORT, sortValue);
            }
          }

          // Update filters
          if (updates.columnFilters !== undefined) {
            // Remove all existing filter params
            Array.from(newParams.keys()).forEach(key => {
              if (key.startsWith(`${PARAM_KEYS.FILTER_PREFIX}.`)) {
                newParams.delete(key);
              }
            });

            // Add new filter params
            updates.columnFilters.forEach(filter => {
              const serialized = serializeFilterValue(filter.value);
              if (serialized) {
                newParams.set(
                  `${PARAM_KEYS.FILTER_PREFIX}.${filter.id}`,
                  serialized
                );
              }
            });
          }

          return newParams;
        },
        { replace: false }
      );
    },
    [setSearchParams, defaultPageSize]
  );

  /* =========================
     State Setters
  ========================= */

  const setPagination = useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState)
    ) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;
      updateUrl({ pagination: newPagination });
    },
    [pagination, updateUrl]
  );

  const setSorting = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newSorting =
        typeof updater === "function" ? updater(sorting) : updater;
      updateUrl({ sorting: newSorting });
    },
    [sorting, updateUrl]
  );

  const setColumnFilters = useCallback(
    (
      updater:
        | ColumnFiltersState
        | ((old: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      const newFilters =
        typeof updater === "function" ? updater(columnFilters) : updater;

      // Reset to first page when filters change
      updateUrl({
        columnFilters: newFilters,
        pagination: { ...pagination, pageIndex: 0 },
      });
    },
    [columnFilters, pagination, updateUrl]
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: false });
  }, [setSearchParams]);

  return {
    pagination,
    sorting,
    columnFilters,
    setPagination,
    setSorting,
    setColumnFilters,
    resetFilters,
    isFiltered,
  };
}
