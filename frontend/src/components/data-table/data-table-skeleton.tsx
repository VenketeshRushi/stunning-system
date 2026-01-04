import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableSkeletonProps extends React.ComponentProps<"div"> {
  columnCount: number;
  rowCount?: number;
  searchWidth?: string;
  cellWidths?: string[];
  withPagination?: boolean;
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  searchWidth = "320px",
  cellWidths = ["auto"],
  withPagination = true,
  className,
  ...props
}: DataTableSkeletonProps) {
  const tableCellWidths = Array.from(
    { length: columnCount },
    (_, index) => cellWidths[index % cellWidths.length] ?? "auto"
  );

  return (
    <div className={cn("flex w-full flex-col gap-4", className)} {...props}>
      {/* Top Toolbar */}
      <div className='flex items-center justify-between gap-4 flex-wrap p-4 bg-muted/20 rounded-lg border border-border/80'>
        <div className='flex-1 flex items-center gap-2'>
          {/* Search Input Skeleton */}
          <Skeleton
            className='h-8'
            style={{ width: searchWidth, maxWidth: "320px" }}
          />
        </div>

        {/* Action Buttons Group - Simplified */}
        <div className='flex items-center gap-1'>
          <Skeleton className='h-9 w-16' />
          <Skeleton className='h-9 w-16' />
          <Skeleton className='h-9 w-16' />
          <Skeleton className='h-9 w-9' />
        </div>
      </div>

      {/* Table Container */}
      <div className='relative rounded-lg border bg-card shadow-sm overflow-hidden'>
        <div className='overflow-auto max-h-[70vh]'>
          <Table>
            <TableHeader className='sticky top-0 z-10 bg-background/95 backdrop-blur-sm shadow-sm border-b'>
              <TableRow className='hover:bg-transparent border-b-border/60'>
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableHead
                    key={j}
                    className='h-10 pl-4'
                    style={{
                      width: tableCellWidths[j],
                      minWidth: tableCellWidths[j],
                    }}
                  >
                    <Skeleton className='h-4 w-full' />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rowCount }).map((_, i) => (
                <TableRow
                  key={i}
                  className='h-14 border-b border-border/40 hover:bg-transparent'
                >
                  {Array.from({ length: columnCount }).map((_, j) => (
                    <TableCell
                      key={j}
                      className='py-2 pl-4'
                      style={{
                        width: tableCellWidths[j],
                        minWidth: tableCellWidths[j],
                      }}
                    >
                      <Skeleton className='h-5 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {withPagination && (
        <div className='flex flex-col-reverse gap-3 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between'>
          <Skeleton className='h-5 w-32' />
          <div className='flex flex-col items-center gap-3 sm:flex-row sm:gap-6'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-9 w-[70px]' />
            </div>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-4 w-24' />
              <div className='flex items-center gap-1'>
                <Skeleton className='h-9 w-9' />
                <Skeleton className='h-9 w-9' />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
