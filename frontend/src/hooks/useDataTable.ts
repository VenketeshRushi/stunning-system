// src/hooks/useDataTable.ts
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";
import { TABLE_CONFIG } from "@/types/dataTableTypes";

interface UseDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  rowCount: number;
  getRowId?: (row: TData) => string;
  enableRowSelection?: boolean;
  defaultPageSize?: number;
  onStateChange?: (state: {
    pagination: PaginationState;
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
  }) => void;
}

export function useDataTable<TData>({
  data,
  columns,
  rowCount,
  getRowId,
  enableRowSelection = true,
  defaultPageSize = TABLE_CONFIG.DEFAULT_PAGE_SIZE,
  onStateChange,
}: UseDataTableProps<TData>) {
  const [searchParams, setSearchParams] = useSearchParams();

  // ===== LOCAL STATE (Not in URL) =====
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // ===== URL STATE MANAGEMENT =====

  // Pagination from URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = parseInt(
    searchParams.get("perPage") || String(defaultPageSize),
    10
  );

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: Math.max(0, page - 1), // Convert to 0-based index
      pageSize: perPage,
    }),
    [page, perPage]
  );

  // Sorting from URL
  const sortParam = searchParams.get("sort");
  const sorting = useMemo<SortingState>(() => {
    if (!sortParam) return [];

    const isDesc = sortParam.startsWith("-");
    const field = isDesc ? sortParam.slice(1) : sortParam;

    return [{ id: field, desc: isDesc }];
  }, [sortParam]);

  // Filters from URL
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];

    searchParams.forEach((value, key) => {
      // Skip pagination and sorting params
      if (key === "page" || key === "perPage" || key === "sort") return;

      filters.push({
        id: key,
        value: value,
      });
    });

    return filters;
  }, [searchParams]);

  // ===== URL UPDATE FUNCTIONS =====

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        prev => {
          const newParams = new URLSearchParams(prev);

          Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "") {
              newParams.delete(key);
            } else {
              newParams.set(key, value);
            }
          });

          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
    updaterOrValue => {
      const newPagination =
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue;

      updateSearchParams({
        page: String(newPagination.pageIndex + 1), // Convert to 1-based
        perPage: String(newPagination.pageSize),
      });
    },
    [pagination, updateSearchParams]
  );

  const onSortingChange: OnChangeFn<SortingState> = useCallback(
    updaterOrValue => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;

      if (newSorting.length === 0) {
        updateSearchParams({ sort: null });
      } else {
        const sort = newSorting[0];
        const sortValue = sort.desc ? `-${sort.id}` : sort.id;
        updateSearchParams({ sort: sortValue });
      }
    },
    [sorting, updateSearchParams]
  );

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = useCallback(
    updaterOrValue => {
      const newFilters =
        typeof updaterOrValue === "function"
          ? updaterOrValue(columnFilters)
          : updaterOrValue;

      const updates: Record<string, string | null> = {};

      // Clear old filters
      columnFilters.forEach(filter => {
        if (!newFilters.find(f => f.id === filter.id)) {
          updates[filter.id] = null;
        }
      });

      // Add new filters
      newFilters.forEach(filter => {
        updates[filter.id] = String(filter.value);
      });

      // Reset to page 1 when filters change
      updates.page = "1";

      updateSearchParams(updates);
    },
    [columnFilters, updateSearchParams]
  );

  // ===== CLEAR SELECTION ON STATE CHANGES =====
  useEffect(() => {
    setRowSelection({});
  }, [page, perPage, sortParam, searchParams]);

  // ===== NOTIFY PARENT OF STATE CHANGES =====
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ pagination, sorting, columnFilters });
    }
  }, [pagination, sorting, columnFilters, onStateChange]);

  // ===== PAGE COUNT =====
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(rowCount / pagination.pageSize)),
    [rowCount, pagination.pageSize]
  );

  // ===== CREATE TABLE =====
  const table = useReactTable({
    data,
    columns,
    rowCount,
    pageCount,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    getRowId,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableRowSelection,
    enableMultiRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return {
    table,
    // Expose state for external use
    pagination,
    sorting,
    columnFilters,
    rowSelection,
  };
}
