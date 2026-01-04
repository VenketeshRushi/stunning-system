import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFacetedRowModel,
  flexRender,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Settings2,
  X,
  RotateCw,
} from "lucide-react";
import { useUrlFilterState } from "@/hooks/UseUrlFilterStateReturn";
import { ShareFilterButton } from "@/components/data-table/ShareFilterButton";
import { ExportButton } from "@/components/data-table/ExportButton";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { useSearchParams } from "react-router-dom";

// --- Types ---
export interface FetchParams {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  search?: string;
}

// Config for Mobile Card Layout
export interface MobileConfig {
  titleKey: string;
  subtitleKey: string;
  imageKey?: string;
  fallbackIcon?: React.ReactNode;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalRows: number;
  loading: boolean;
  onFetch: (params: FetchParams) => Promise<void>;
  renderTopToolbar?: (
    selectedRows: TData[],
    search: string,
    setSearch: (value: string) => void
  ) => React.ReactNode;
  rowIdKey?: string;
  mobileConfig?: MobileConfig;
  enableUrlState?: boolean;
  exportFilename?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalRows,
  loading,
  onFetch,
  renderTopToolbar,
  rowIdKey = "id",
  mobileConfig = { titleKey: "name", subtitleKey: "email" },
  enableUrlState = true,
  exportFilename = "export",
}: DataTableProps<TData, TValue>) {
  const [searchParams, setSearchParams] = useSearchParams();

  // --- URL-based state (when enabled) ---
  const urlState = useUrlFilterState(10);

  // --- Local state (fallback when URL state is disabled) ---
  const [localPagination, setLocalPagination] = React.useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: 10,
    }
  );
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const [localColumnFilters, setLocalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [localSearch, setLocalSearch] = React.useState<string>("");

  // --- Search State Management (URL or Local) ---
  const getSearchFromUrl = () => searchParams.get("search") || "";

  const globalSearch = enableUrlState ? getSearchFromUrl() : localSearch;

  const setGlobalSearch = React.useCallback(
    (value: string) => {
      if (enableUrlState) {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
          newParams.set("search", value);
        } else {
          newParams.delete("search");
        }
        setSearchParams(newParams, { replace: true });
      } else {
        setLocalSearch(value);
      }
    },
    [enableUrlState, searchParams, setSearchParams]
  );

  // Choose state source based on enableUrlState prop
  const pagination = enableUrlState ? urlState.pagination : localPagination;
  const sorting = enableUrlState ? urlState.sorting : localSorting;
  const columnFilters = enableUrlState
    ? urlState.columnFilters
    : localColumnFilters;
  const setPagination = enableUrlState
    ? urlState.setPagination
    : setLocalPagination;
  const setSorting = enableUrlState ? urlState.setSorting : setLocalSorting;
  const setColumnFilters = enableUrlState
    ? urlState.setColumnFilters
    : setLocalColumnFilters;
  const isFiltered = enableUrlState
    ? urlState.isFiltered
    : localColumnFilters.length > 0;

  // Check if any filters, search, or sorting are active
  const hasActiveFilters =
    isFiltered || globalSearch.length > 0 || sorting.length > 0;

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isInitialLoad, setIsInitialLoad] = React.useState<boolean>(true);

  // --- Table Instance ---
  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    rowCount: totalRows,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getRowId: (row: any) => row[rowIdKey],
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // --- Effects ---
  React.useEffect(() => {
    const isFilterActive = columnFilters.length > 0 || globalSearch.length > 0;
    const delay = isFilterActive ? 500 : 0; // Debounce when filtering/searching

    const timeoutId = setTimeout(() => {
      onFetch({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        columnFilters,
        search: globalSearch.trim() || undefined,
      }).finally(() => {
        // Mark initial load as complete
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalSearch,
    onFetch,
    isInitialLoad,
  ]);

  React.useEffect(() => {
    setRowSelection({});
  }, [data]);

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map(r => r.original);

  // Clear all filters and search handler
  const handleResetFilters = React.useCallback(() => {
    if (enableUrlState) {
      // Create fresh URLSearchParams to clear everything
      const newParams = new URLSearchParams();

      // Keep only the page size (limit) if it exists
      const currentLimit = searchParams.get("limit");
      if (currentLimit) {
        newParams.set("limit", currentLimit);
      }

      // Reset to page 1
      newParams.set("page", "1");

      // Update URL - this clears sort, filters, and search all at once
      setSearchParams(newParams, { replace: true });

      // Also update urlState's internal state if it has a reset method
      // This ensures the hook's state is synchronized
      if (typeof urlState.resetFilters === "function") {
        urlState.resetFilters();
      }
    } else {
      setLocalColumnFilters([]);
      setLocalSorting([]);
      setLocalPagination({ pageIndex: 0, pageSize: 10 });
      setLocalSearch("");
    }
  }, [enableUrlState, urlState, searchParams, setSearchParams]);

  const handleRefresh = React.useCallback(() => {
    onFetch({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      columnFilters,
      search: globalSearch.trim() || undefined,
    });
  }, [onFetch, pagination, sorting, columnFilters, globalSearch]);

  return (
    <div className='w-full space-y-4'>
      {/* Show skeleton on initial load */}
      {loading && isInitialLoad ? (
        <DataTableSkeleton
          columnCount={columns.length}
          rowCount={5}
          searchWidth='320px'
        />
      ) : (
        <>
          {/* --- Top Toolbar --- */}
          <div className='w-full grid grid-cols-1 lg:flex gap-4'>
            {/* Left (Search & Filter) */}
            <div className='flex-1 w-full flex flex-col lg:flex-row items-center justify-start gap-2'>
              {renderTopToolbar?.(selectedRows, globalSearch, setGlobalSearch)}

              {hasActiveFilters && (
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 px-2 lg:px-3 gap-1 ml-auto mt-2 lg:mt-0 w-full lg:w-auto'
                  onClick={handleResetFilters}
                >
                  Clear filters
                  <X className='ml-1 h-3 w-3' />
                </Button>
              )}
            </div>

            {/* Right (Actions Group) */}
            <ButtonGroup className='w-full lg:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-2'>
              {/* View Columns */}
              <div className='flex-1 sm:flex-none'>
                <DropdownMenu>
                  {/* ... */}
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='w-full justify-center gap-1'
                    >
                      <Settings2 className='h-4 w-4' />
                      <span className='hidden sm:inline'>View</span>
                    </Button>
                  </DropdownMenuTrigger>
                  {/* ... */}
                </DropdownMenu>
              </div>

              {/* Export */}
              <div className='flex-1 sm:flex-none'>
                <ExportButton
                  table={table}
                  filename={exportFilename}
                  variant='outline'
                  size='sm'
                  className='w-full'
                />
              </div>

              {/* Share */}
              <div className='flex-1 sm:flex-none'>
                <ShareFilterButton
                  variant='outline'
                  size='sm'
                  className='w-full'
                />
              </div>

              {/* Refresh */}
              <div className='flex-1 sm:flex-none'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleRefresh}
                      disabled={loading}
                      className='w-full justify-center gap-1'
                    >
                      <RotateCw
                        className={cn("h-4 w-4", loading && "animate-spin")}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh data</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </ButtonGroup>
          </div>

          {/* --- Table Container --- */}
          <div className='relative rounded-lg border bg-card shadow-sm overflow-hidden'>
            {/* --- Desktop Table --- */}
            <div className='hidden md:block overflow-auto max-h-[70vh]'>
              <Table>
                <TableHeader className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm shadow-sm border-b'>
                  {table.getHeaderGroups().map(hg => (
                    <TableRow
                      key={hg.id}
                      className='hover:bg-transparent border-b-border/60'
                    >
                      {hg.headers.map(header => (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          className='h-10 text-lg font-bold uppercase tracking-wider pl-4'
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>

                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map(row => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className='group h-14 border-b border-border/40 transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted/60'
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell
                            key={cell.id}
                            className='py-2 pl-4 text-sm tabular-nums text-foreground/90'
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className='h-[400px] text-center'
                      >
                        {!loading && (
                          <div className='flex flex-col items-center justify-center text-muted-foreground'>
                            <Inbox className='h-10 w-10 mb-2 opacity-20' />
                            <p>No results found</p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* --- Mobile Cards --- */}
            <div className='flex flex-col gap-3 p-4 md:hidden bg-muted/5'>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => {
                  const titleCell = row
                    .getVisibleCells()
                    .find(c => c.column.id === mobileConfig.titleKey);
                  const subtitleCell = row
                    .getVisibleCells()
                    .find(c => c.column.id === mobileConfig.subtitleKey);
                  const selectCell = row
                    .getVisibleCells()
                    .find(c => c.column.id === "select");
                  const actionsCell = row
                    .getVisibleCells()
                    .find(c => c.column.id === "actions");

                  const titleValue = titleCell
                    ? flexRender(
                        titleCell.column.columnDef.cell,
                        titleCell.getContext()
                      )
                    : (row.original as any)[mobileConfig.titleKey] || "Unknown";

                  return (
                    <div
                      key={row.id}
                      className={cn(
                        "flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden transition-all",
                        row.getIsSelected()
                          ? "ring-2 ring-primary ring-offset-2 border-primary"
                          : "hover:border-primary/50"
                      )}
                    >
                      {/* Header */}
                      <div className='flex items-start gap-4 border-b p-4 bg-card/50'>
                        <div className='flex-1 flex flex-col gap-1 min-w-0'>
                          <div className='text-sm font-semibold truncate'>
                            {titleValue}
                          </div>
                          <div className='text-xs text-muted-foreground truncate'>
                            {subtitleCell &&
                              flexRender(
                                subtitleCell.column.columnDef.cell,
                                subtitleCell.getContext()
                              )}
                          </div>
                        </div>
                        {selectCell &&
                          flexRender(
                            selectCell.column.columnDef.cell,
                            selectCell.getContext()
                          )}
                      </div>

                      {/* Metadata Grid */}
                      <div className='grid grid-cols-[minmax(80px,1fr)_2fr] gap-x-4 gap-y-4 p-4 text-sm'>
                        {row.getVisibleCells().map(cell => {
                          const hidden = [
                            "select",
                            "actions",
                            mobileConfig.titleKey,
                            mobileConfig.subtitleKey,
                            mobileConfig.imageKey,
                          ];
                          if (hidden.includes(cell.column.id)) return null;
                          const label =
                            (cell.column.columnDef.meta as any)?.label ||
                            cell.column.id;
                          return (
                            <React.Fragment key={cell.id}>
                              <div className='text-xs font-medium text-muted-foreground capitalize'>
                                {label}
                              </div>
                              <div className='font-medium text-foreground'>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Footer Actions */}
                      {actionsCell && (
                        <div className='flex items-center justify-between border-t bg-muted/10 px-4 py-3'>
                          <span className='text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider'>
                            Options
                          </span>
                          <div className='flex gap-2'>
                            {flexRender(
                              actionsCell.column.columnDef.cell,
                              actionsCell.getContext()
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : !loading ? (
                <div className='flex flex-col items-center justify-center py-10 text-muted-foreground'>
                  <Inbox className='h-10 w-10 mb-2 opacity-20' />
                  <p className='text-sm'>No results found</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* --- Pagination --- */}
          <div className='flex flex-col-reverse gap-3 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='order-2 text-center text-xs font-medium text-muted-foreground sm:order-1 sm:text-left'>
              {Object.keys(rowSelection).length} selected / {totalRows} total
            </div>
            <div className='order-1 flex flex-col items-center gap-3 sm:order-2 sm:flex-row sm:gap-6'>
              <div className='flex items-center gap-2'>
                <p className='text-xs font-medium text-muted-foreground'>
                  Rows per page
                </p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={val => table.setPageSize(Number(val))}
                >
                  <SelectTrigger className='h-9 w-[80px] text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side='top'>
                    {[10, 20, 50, 100].map(size => (
                      <SelectItem
                        key={size}
                        value={`${size}`}
                        className='text-xs'
                      >
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center gap-2'>
                <div className='min-w-[110px] text-center text-xs font-medium text-muted-foreground'>
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    className='h-9 w-9 p-0'
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    className='h-9 w-9 p-0'
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
