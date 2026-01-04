import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileJson, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadCSV, formatCSVValue } from "@/utils/ext";
import type { Table } from "@tanstack/react-table";

interface ExportButtonProps<TData> {
  table: Table<TData>;
  filename?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ExportButton<TData>({
  table,
  filename = "export",
  variant = "outline",
  size = "sm",
  className,
}: ExportButtonProps<TData>) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const handleExportCSV = async (exportAll: boolean) => {
    try {
      setExporting(true);

      // Get columns (exclude select and actions)
      const columns = table.getAllColumns().filter(col => {
        const meta = col.columnDef.meta as any;
        return (
          col.getIsVisible() &&
          col.id !== "select" &&
          col.id !== "actions" &&
          meta?.label
        );
      });

      // Build CSV header
      const headers = columns.map(col => {
        const meta = col.columnDef.meta as any;
        return meta?.label || col.id;
      });

      const csvRows: string[] = [headers.join(",")];

      // Get data rows
      const rows = exportAll
        ? table.getCoreRowModel().rows
        : table.getRowModel().rows;

      // Build CSV rows
      rows.forEach(row => {
        const values = columns.map(col => {
          const cell = row.getAllCells().find(c => c.column.id === col.id);
          if (!cell) return "";

          // Get raw value
          const value = cell.getValue();
          return formatCSVValue(value);
        });
        csvRows.push(values.join(","));
      });

      // Download CSV
      const csvContent = csvRows.join("\n");
      downloadCSV(csvContent, filename);

      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async (exportAll: boolean) => {
    try {
      setExporting(true);

      // Get visible rows
      const rows = exportAll
        ? table.getCoreRowModel().rows
        : table.getRowModel().rows;

      // Get data
      const data = rows.map(row => row.original);

      // Download JSON
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const timestamp = new Date().toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}-${timestamp}.json`);
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);

      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch (error) {
      console.error("Failed to export JSON:", error);
    } finally {
      setExporting(false);
    }
  };

  const totalRows = table.getCoreRowModel().rows.length;
  const currentRows = table.getRowModel().rows.length;

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant={variant}
                size={size}
                className={className}
                disabled={exporting || totalRows === 0}
              >
                {exported ? (
                  <Check className='h-4 w-4 text-green-600' />
                ) : (
                  <Download className='h-4 w-4' />
                )}
                {size !== "icon" && (
                  <span className='ml-2 hidden sm:inline'>Export</span>
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export data</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align='end' className='w-[220px]'>
          <DropdownMenuLabel>Export Format</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuLabel className='text-xs font-normal text-muted-foreground px-2 py-1'>
            CSV Format
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExportCSV(false)}>
            <FileSpreadsheet className='mr-2 h-4 w-4' />
            Current page ({currentRows} rows)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExportCSV(true)}
            disabled={totalRows === currentRows}
          >
            <FileSpreadsheet className='mr-2 h-4 w-4' />
            All data ({totalRows} rows)
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className='text-xs font-normal text-muted-foreground px-2 py-1'>
            JSON Format
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleExportJSON(false)}>
            <FileJson className='mr-2 h-4 w-4' />
            Current page ({currentRows} rows)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleExportJSON(true)}
            disabled={totalRows === currentRows}
          >
            <FileJson className='mr-2 h-4 w-4' />
            All data ({totalRows} rows)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
