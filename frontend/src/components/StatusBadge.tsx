import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "Active" | "Pending" | "Inactive";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
        // Active Styles (Green)
        status === "Active" &&
          "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
        // Pending Styles (Yellow/Orange)
        status === "Pending" &&
          "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
        // Inactive Styles (Gray)
        status === "Inactive" &&
          "bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-400/10 dark:text-slate-400 dark:ring-slate-400/20"
      )}
    >
      {/* Optional: Add a tiny dot */}
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          status === "Active"
            ? "bg-emerald-600 dark:bg-emerald-400"
            : status === "Pending"
              ? "bg-amber-600 dark:bg-amber-400"
              : "bg-slate-500"
        )}
      />
      {status}
    </span>
  );
}
