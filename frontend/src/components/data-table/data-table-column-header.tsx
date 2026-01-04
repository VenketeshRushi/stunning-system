import * as React from "react";
import type { Column } from "@tanstack/react-table";
import {
  EyeOff,
  Filter,
  X,
  ListFilter,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableDateFilter } from "./data-table-date-filter";

import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectValue,
  MultiSelectGroup,
} from "@/components/ui/multi-select";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.ComponentProps<typeof DropdownMenuTrigger> {
  column: Column<TData, TValue>;
  label: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  label,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  console.log("column", column);
  console.log("label", label);
  console.log("rest props", props);
  const meta = column.columnDef.meta;
  const filterValue = column.getFilterValue() as string | undefined;
  const [isOpen, setIsOpen] = React.useState(false);

  /* =========================
     Handlers
  ========================= */

  const handleTextFilter = (value: string) => {
    column.setFilterValue(value || undefined);
  };

  const handleMultiSelect = (values: string[]) => {
    column.setFilterValue(values.length ? values.join(",") : undefined);
  };

  const handleBooleanSelect = (value: string) => {
    column.setFilterValue(value === "_all" ? undefined : value);
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    column.setFilterValue(undefined);
    setIsOpen(false);
  };

  /* =========================
     Early Exit
  ========================= */

  if (!column.getCanSort() && !column.getCanHide() && !meta?.filterable) {
    return (
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wider text-muted-foreground/70",
          className
        )}
      >
        {label}
      </div>
    );
  }

  const isFiltered = !!filterValue;

  /* =========================
     Render
  ========================= */

  return (
    <div
      className={cn(
        "flex items-center justify-between space-x-2 flex-1",
        className
      )}
    >
      {/* ================= SORT MENU ================= */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm' {...props}>
            <span className='text-sm font-medium'>{label}</span>

            {column.getIsSorted() === "asc" ? (
              <ArrowUpAZ className='ml-2 h-4 w-4' />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDownAZ className='ml-2 h-4 w-4' />
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4' />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='start' className='w-[180px] p-1'>
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                Ascending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                Descending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.clearSorting()}>
                Clear Sort
              </DropdownMenuItem>
            </>
          )}

          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className='mr-2 h-4 w-4' />
                Hide Column
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ================= FILTER ================= */}
      {meta?.filterable && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className={cn(
                "h-7 w-7 rounded transition-all",
                isFiltered
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground/30"
              )}
            >
              <Filter className='h-3 w-3' />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align='start'
            className='w-[280px] p-0 border-border/60 shadow-lg'
          >
            {/* Header */}
            <div className='flex items-center justify-between border-b bg-muted/40 px-3 py-2'>
              <div className='flex items-center gap-2'>
                <ListFilter className='h-3.5 w-3.5 text-primary' />
                <span className='text-xs font-semibold'>Filter {label}</span>
              </div>
              {isFiltered && (
                <Button size='icon' variant='ghost' onClick={clearFilter}>
                  <X className='h-3 w-3' />
                </Button>
              )}
            </div>

            {/* Body */}
            <div className='p-3 space-y-3'>
              {meta.filterType === "text" && (
                <Input
                  autoFocus
                  placeholder='Type to search...'
                  value={filterValue ?? ""}
                  onChange={e => handleTextFilter(e.target.value)}
                />
              )}

              {meta.filterType === "boolean" && (
                <Select
                  value={filterValue ?? "_all"}
                  onValueChange={handleBooleanSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='All' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='_all'>All</SelectItem>
                    <SelectItem value='true'>True</SelectItem>
                    <SelectItem value='false'>False</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {(meta.filterType === "select" ||
                meta.filterType === "multiselect" ||
                meta.filterType === "enum") &&
                meta.options && (
                  <MultiSelect
                    values={filterValue?.split(",") ?? []}
                    onValuesChange={handleMultiSelect}
                  >
                    <MultiSelectTrigger>
                      <MultiSelectValue placeholder='Select options...' />
                    </MultiSelectTrigger>

                    <MultiSelectContent>
                      <MultiSelectGroup>
                        {meta.options.map(opt => (
                          <MultiSelectItem
                            key={opt.value}
                            value={String(opt.value)}
                          >
                            {opt.label}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectGroup>
                    </MultiSelectContent>
                  </MultiSelect>
                )}

              {meta.filterType === "date" && (
                <DataTableDateFilter column={column} title={label} />
              )}
            </div>

            {/* Footer */}
            <div className='border-t bg-muted/20 px-3 py-2 text-right'>
              <Button size='sm' onClick={() => setIsOpen(false)}>
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
