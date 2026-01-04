import * as React from "react";
import type { Column } from "@tanstack/react-table";
import { Check, PlusCircle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Option } from "@/types/dataTableTypes";

// MultiSelect API (your component)
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectValue,
  MultiSelectGroup,
  MultiSelectSeparator,
} from "@/components/ui/multi-select";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: Option[];
  multiple?: boolean;
}

/**
 * Updated DataTableFacetedFilter
 * - Uses the project's MultiSelect component (values / onValuesChange / single)
 * - Works when column is defined (integrates with TanStack column.setFilterValue)
 * - Works standalone if column is not provided (keeps internal state)
 */
export function DataTableFacetedFilter<TData, TValue>({
  column,
  title = "Filter",
  options,
  multiple = true,
}: DataTableFacetedFilterProps<TData, TValue>) {
  // Derive selected values from column if present, otherwise local state
  const columnValue = column?.getFilterValue();
  const initialSelected: string[] = Array.isArray(columnValue)
    ? columnValue
    : [];

  // Local fallback state when no column is provided
  const [localValues, setLocalValues] =
    React.useState<string[]>(initialSelected);

  // Selected set (prefer column-driven value when available)
  const selectedValuesSet = new Set<string>(
    Array.isArray(columnValue) ? columnValue : localValues
  );

  // Handler used by MultiSelect (values is string[])
  const handleValuesChange = React.useCallback(
    (values: string[]) => {
      // update column if present
      if (column) {
        // If nothing selected -> clear filter
        column.setFilterValue(values.length ? values : undefined);
        // For single-selection close behavior is handled by MultiSelect (single prop)
      } else {
        // local fallback
        setLocalValues(values);
      }
    },
    [column]
  );

  const onReset = React.useCallback(
    (evt?: React.MouseEvent) => {
      evt?.stopPropagation();
      if (column) column.setFilterValue(undefined);
      else setLocalValues([]);
    },
    [column]
  );

  const selectedCount = selectedValuesSet.size;

  // For display in trigger we provide MultiSelectValue which renders badges/tokens
  return (
    <div>
      <MultiSelect
        values={[...selectedValuesSet]}
        onValuesChange={handleValuesChange}
        single={!multiple}
      >
        {/* Trigger: keep your previous compact button look, but use MultiSelectTrigger */}
        <MultiSelectTrigger
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
            "min-w-[120px] border border-input bg-transparent"
          )}
        >
          {/* left icon: selected or plus */}
          {selectedCount > 0 ? (
            // MultiSelectValue renders badges (using the provided MultiSelectValue component)
            <div className='flex items-center gap-2 min-w-0'>
              <div className='hidden sm:block text-xs font-medium truncate mr-1'>
                {title}
              </div>
              <div className='min-w-0 flex-1'>
                <MultiSelectValue
                  placeholder={title}
                  clickToRemove={true}
                  overflowBehavior='wrap-when-open'
                />
              </div>
            </div>
          ) : (
            <div className='flex items-center gap-2 min-w-0'>
              <PlusCircle className='size-4' />
              <span className='text-sm font-medium truncate'>{title}</span>
            </div>
          )}

          {/* show a small count on the right for compactness on small screens */}
          {selectedCount > 0 && (
            <div className='hidden lg:flex items-center'>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge
                variant='secondary'
                className='rounded-sm px-1 font-normal'
              >
                {selectedCount}
              </Badge>
            </div>
          )}
        </MultiSelectTrigger>

        {/* Content: searchable list + groups + clear action */}
        <MultiSelectContent search={{ placeholder: `Search ${title}` }}>
          <MultiSelectGroup>
            {options.map(opt => (
              <MultiSelectItem key={opt.value} value={String(opt.value)}>
                <div className='flex items-center gap-2 w-full'>
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-sm border",
                      "text-muted-foreground"
                    )}
                  >
                    <Check className='size-4 opacity-60' />
                  </div>
                  {opt.icon && (
                    <span className='mr-1'>
                      <opt.icon className='size-4' />
                    </span>
                  )}
                  <span className='truncate'>{opt.label}</span>
                  {opt.count != null && (
                    <span className='ml-auto font-mono text-xs'>
                      {opt.count}
                    </span>
                  )}
                </div>
              </MultiSelectItem>
            ))}
          </MultiSelectGroup>

          {/* Clear / Select All area shown when something is selected */}
          {selectedCount > 0 && (
            <>
              <MultiSelectSeparator />
              <div className='p-2'>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={e => {
                      e.stopPropagation();
                      onReset(e);
                    }}
                  >
                    <XCircle className='size-4 mr-2' />
                    Clear
                  </Button>
                </div>
              </div>
            </>
          )}
        </MultiSelectContent>
      </MultiSelect>
    </div>
  );
}
