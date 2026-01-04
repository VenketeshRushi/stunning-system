import type { ColumnFiltersState } from "@tanstack/react-table";
import type { Filter } from "@/schemas/users.schema";

/**
 * Maps TanStack Table filter state to Backend API filter schema.
 * Supports multi-select CSV strings like "admin,user".
 */
export function mapColumnFiltersToBackend(filters: ColumnFiltersState): Filter {
  const backendFilter: Filter = {};

  filters.forEach(filter => {
    const { id, value } = filter;
    if (value === undefined || value === null || value === "") return;

    switch (id) {
      case "name":
      case "email":
        if (typeof value === "string")
          backendFilter[id] = { iLike: `%${value}%` };
        break;

      case "status":
        if (value === "active") {
          backendFilter["is_active"] = { eq: true };
          backendFilter["is_banned"] = { eq: false };
        } else if (value === "inactive") {
          backendFilter["is_active"] = { eq: false };
          backendFilter["is_banned"] = { eq: false };
        } else if (value === "banned") {
          backendFilter["is_banned"] = { eq: true };
        }
        break;

      case "role":
      case "login_method":
        if (typeof value === "string") {
          const arr = value.includes(",")
            ? value.split(",").map(v => v.trim())
            : [value];
          backendFilter[id] = { inArray: arr };
        } else if (Array.isArray(value) && value.length > 0) {
          backendFilter[id] = { inArray: value };
        }
        break;

      case "onboarding":
        backendFilter[id] = { eq: String(value) === "true" };
        break;

      case "created_at":
        if (typeof value === "object" && value !== null && "from" in value) {
          const range = value as { from?: Date; to?: Date };
          if (range.from) {
            const startDate = new Date(range.from);
            startDate.setHours(0, 0, 0, 0);

            if (range.to) {
              const endDate = new Date(range.to);
              endDate.setHours(23, 59, 59, 999);
              backendFilter[id] = {
                isBetween: [startDate.toISOString(), endDate.toISOString()],
              };
            } else backendFilter[id] = { gte: startDate.toISOString() };
          }
        } else if (typeof value === "string") {
          const startDate = new Date(value);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(value);
          endDate.setHours(23, 59, 59, 999);
          backendFilter[id] = {
            isBetween: [startDate.toISOString(), endDate.toISOString()],
          };
        }
        break;

      default:
        if (["string", "number", "boolean"].includes(typeof value)) {
          backendFilter[id] = { eq: value as string | number | boolean };
        }
    }
  });

  return backendFilter;
}
