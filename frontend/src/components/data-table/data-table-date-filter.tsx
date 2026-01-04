import type { Column } from "@tanstack/react-table";
import { CalendarIcon, X } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function formatDate(date: Date | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

interface DataTableDateFilterProps<TData> {
  column: Column<TData, unknown>;
  title?: string;
  className?: string;
}

export function DataTableDateFilter<TData>({
  column,
  title = "Date",
  className,
}: DataTableDateFilterProps<TData>) {
  const columnFilterValue = column.getFilterValue() as DateRange | undefined;
  const [isOpen, setIsOpen] = React.useState(false);

  // --- Presets Logic ---
  const presets = [
    {
      label: "Today",
      getValue: () => ({
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      }),
    },
    {
      label: "Yesterday",
      getValue: () => {
        const yesterday = subDays(new Date(), 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      },
    },
    {
      label: "Last 7 Days",
      getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
    },
    {
      label: "Last 30 Days",
      getValue: () => ({ from: subDays(new Date(), 30), to: new Date() }),
    },
    {
      label: "This Month",
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      }),
    },
  ];

  const onSelect = React.useCallback(
    (range: DateRange | undefined) => {
      column.setFilterValue(range);
    },
    [column]
  );

  const onReset = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      column.setFilterValue(undefined);
      setIsOpen(false);
    },
    [column]
  );

  // const onPresetChange = (value: string) => {
  //   const preset = presets.find(p => p.label === value);
  //   if (preset) {
  //     onSelect(preset.getValue());
  //   }
  // };

  const label = React.useMemo(() => {
    if (!columnFilterValue?.from) return title;

    if (columnFilterValue.to) {
      return `${formatDate(columnFilterValue.from)} - ${formatDate(columnFilterValue.to)}`;
    }
    return formatDate(columnFilterValue.from);
  }, [columnFilterValue, title]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className={cn(
            "h-8 justify-start text-left font-normal border-dashed px-2",
            !columnFilterValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          <span className='truncate'>{label}</span>
          {columnFilterValue?.from && (
            <div
              role='button'
              onClick={onReset}
              className='ml-auto hover:bg-accent hover:text-accent-foreground rounded-sm p-0.5 transition-colors'
            >
              <X className='h-3 w-3' />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <div className='flex flex-col sm:flex-row'>
          {/* Presets Sidebar */}
          <div className='flex flex-col gap-1 p-2 border-b sm:border-b-0 sm:border-r'>
            <div className='text-xs font-semibold text-muted-foreground mb-1 px-2'>
              Presets
            </div>
            {presets.map(preset => (
              <Button
                key={preset.label}
                variant='ghost'
                size='sm'
                className='justify-start text-xs h-7'
                onClick={() => onSelect(preset.getValue())}
              >
                {preset.label}
              </Button>
            ))}
            <Separator className='my-1' />
            <Button
              variant='ghost'
              size='sm'
              className='justify-start text-xs h-7 text-destructive hover:text-destructive'
              onClick={() => {
                column.setFilterValue(undefined);
              }}
            >
              Reset
            </Button>
          </div>

          {/* Calendar */}
          <div className='p-2'>
            <Calendar
              initialFocus
              mode='range'
              defaultMonth={columnFilterValue?.from}
              selected={columnFilterValue}
              onSelect={onSelect}
              numberOfMonths={2}
              className='sm:block hidden'
            />
            {/* Single Month for Mobile */}
            <Calendar
              initialFocus
              mode='range'
              defaultMonth={columnFilterValue?.from}
              selected={columnFilterValue}
              onSelect={onSelect}
              numberOfMonths={1}
              className='sm:hidden block'
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
