import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/schemas/users.schema";
import type { Option } from "@/types/dataTableTypes";

import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  MoreHorizontal,
  Mail,
  Globe,
  Shield,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Smartphone,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* =========================
   CONSTANTS
========================= */

export const statuses: (Option & { className: string })[] = [
  {
    value: "active",
    label: "Active",
    icon: CheckCircle2,
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: AlertCircle,
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  },
  {
    value: "banned",
    label: "Banned",
    icon: XCircle,
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
];

export const roles: (Option & { iconColor: string })[] = [
  {
    value: "superadmin",
    label: "Super Admin",
    icon: Shield,
    iconColor: "text-purple-500",
  },
  {
    value: "admin",
    label: "Admin",
    icon: Shield,
    iconColor: "text-blue-500",
  },
  {
    value: "user",
    label: "User",
    icon: UserIcon,
    iconColor: "text-muted-foreground",
  },
];

export const loginMethods: Option[] = [
  { value: "email_password", label: "Email", icon: Mail },
  { value: "google_oauth", label: "Google", icon: Globe },
  { value: "facebook_oauth", label: "Facebook", icon: Globe },
  { value: "mobile_otp", label: "Mobile", icon: Smartphone },
];

/* =========================
   COLUMN DEFINITIONS
========================= */

export const columns: ColumnDef<User, unknown>[] = [
  /* ---------- SELECT ---------- */
  {
    id: "select",
    accessorKey: "id",
    header: ({ table }) => (
      <div className='flex h-full w-10 items-center justify-center'>
        <Checkbox
          className='data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700'
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className='flex h-full w-10 items-center justify-center'>
        <Checkbox
          className='data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700'
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },

  /* ---------- NAME ---------- */
  {
    accessorKey: "name",
    header: ({ column }) => {
      console.log("Column", column);
      return <DataTableColumnHeader column={column} label='Name' />;
    },
    meta: {
      field: "name",
      label: "Name",
      filterable: true,
      filterType: "text",
      valueType: "string",
    },
  },

  /* ---------- EMAIL ---------- */
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label='Email' />
    ),
    meta: {
      field: "email",
      label: "Email",
      filterable: true,
      filterType: "text",
      valueType: "string",
    },
  },

  /* ---------- ROLE (MULTISELECT) ---------- */
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label='Role' />
    ),
    size: 160,
    meta: {
      field: "role",
      label: "Role",
      filterable: true,
      filterType: "multiselect",
      valueType: "enum",
      options: roles,
    },
    cell: ({ getValue }) => {
      const raw = getValue<string>() ?? "";

      const roleList = raw
        .split(",")
        .map(r => r.trim())
        .filter(Boolean);

      if (!roleList.length) {
        return <span className='text-muted-foreground text-sm'>—</span>;
      }

      return (
        <div className='flex flex-wrap gap-2'>
          {roleList.map(rv => {
            const role = roles.find(r => r.value === rv) ?? {
              value: rv,
              label: rv,
              icon: HelpCircle,
              iconColor: "text-muted-foreground",
            };

            const Icon = role.icon!;
            return (
              <div
                key={rv}
                className='flex items-center gap-1 text-sm font-medium'
              >
                <Icon className={cn("h-4 w-4", role.iconColor)} />
                {role.label}
              </div>
            );
          })}
        </div>
      );
    },
  },

  /* ---------- STATUS (DERIVED) ---------- */
  {
    id: "status",
    accessorFn: row => {
      if (row.is_banned) return "banned";
      if (row.is_active) return "active";
      return "inactive";
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label='Status' />
    ),
    meta: {
      field: "status",
      label: "Status",
      filterable: true,
      filterType: "select",
      valueType: "derived",
      derived: true,
      options: statuses,
    },
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const status = statuses.find(s => s.value === value) ?? statuses[1];

      const Icon = status.icon!;
      return (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
            status.className
          )}
        >
          <Icon className='h-3 w-3' />
          {status.label}
        </div>
      );
    },
  },

  /* ---------- LOGIN METHOD ---------- */
  {
    accessorKey: "login_method",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label='Login Method' />
    ),
    meta: {
      field: "login_method",
      label: "Login Method",
      filterable: true,
      filterType: "select",
      valueType: "enum",
      options: loginMethods,
    },
  },

  /* ---------- ONBOARDING ---------- */
  {
    accessorKey: "onboarding",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label='Onboarded' />
    ),
    meta: {
      field: "onboarding",
      label: "Onboarded",
      filterable: true,
      filterType: "boolean",
      valueType: "boolean",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
    },
    cell: ({ getValue }) => {
      const val = Boolean(getValue<boolean>());
      return (
        <Badge variant={val ? "default" : "outline"}>
          {val ? "Complete" : "Pending"}
        </Badge>
      );
    },
  },

  /* ---------- CREATED ---------- */
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label='Created' />
    ),
    meta: {
      field: "created_at",
      label: "Created At",
      filterable: true,
      filterType: "date",
      valueType: "date",
    },
  },

  /* ---------- ACTIONS ---------- */
  {
    id: "actions",
    accessorKey: "id",
    header: ({ column }) => <DataTableColumnHeader column={column} label='' />,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon'>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(row.original.id)}
          >
            Copy User ID
          </DropdownMenuItem>
          <DropdownMenuItem>View</DropdownMenuItem>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className='text-destructive'>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
