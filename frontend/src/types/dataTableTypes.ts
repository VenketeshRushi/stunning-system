import type { Row, RowData } from "@tanstack/react-table";
import type { ComponentType } from "react";

/* =========================
   Shared Interfaces
========================= */

export interface Option {
  label: string;
  value: string; // string for URL compatibility
  icon?: ComponentType<{ className?: string }>;
  count?: number;
}

export interface DataTableRowAction<TData> {
  row: Row<TData>;
  variant: "update" | "delete";
}

/* =========================
   Table Config
========================= */

export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 30, 40, 50],
  FILTER_DEBOUNCE_MS: 300,
} as const;

/* =========================
   TanStack Column Meta
========================= */

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    field: string;
    label: string;
    filterable: boolean;

    filterType: "text" | "select" | "multiselect" | "boolean" | "date" | "enum";

    valueType: "string" | "number" | "boolean" | "date" | "enum" | "derived";
    options?: Option[];
    derived?: boolean;
  }
}
