import { useState, useMemo, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  type FetchParams,
} from "@/components/data-table/data-table";
import { UsersServices } from "@/services/users.services";
import type { User } from "@/schemas/users.schema";
import { columns as userColumns } from "./columns";
import { mapColumnFiltersToBackend } from "@/components/data-table/filter-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { GlobalSearchInput } from "@/components/data-table/GlobalSearchInput";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/stores/auth.store";

function UserManagement() {
  const role = useUserRole();
  if (role !== "admin" && role !== "superadmin") {
    return <Navigate to='/' replace />;
  }
  // --- State Management ---
  const [data, setData] = useState<User[]>([]);
  const [rowCount, setRowCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo<ColumnDef<User>[]>(() => userColumns, []);

  // --- Fetch Users Handler ---
  const handleFetchData = useCallback(async (params: FetchParams) => {
    setLoading(true);
    setError(null);

    try {
      // Build sort parameter
      const sortParam =
        params.sorting?.length > 0
          ? `${params.sorting[0].desc ? "-" : ""}${params.sorting[0].id}`
          : undefined;

      // Build filter parameter
      const filterParam =
        params.columnFilters?.length > 0
          ? mapColumnFiltersToBackend(params.columnFilters)
          : undefined;

      // Build search parameter
      const search = params.search?.trim() ? params.search.trim() : undefined;

      // Fetch users from API
      const response = await UsersServices.fetchUsers({
        page: params.pageIndex + 1, // API uses 1-based pagination
        ...(params.pageSize && { limit: params.pageSize }),
        ...(sortParam && { sort: sortParam }),
        ...(search && { search }),
        ...(filterParam && { filter: filterParam }),
      });

      // Update state with fetched data
      setData(response.data.users);
      setRowCount(response.data.pagination.total);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Bulk Delete Handler ---
  const handleBulkDelete = useCallback(async (selectedUsers: User[]) => {
    const selectedIds = selectedUsers.map(u => u.id);

    if (!selectedIds.length) return;

    // Confirm deletion
    if (
      !confirm(`Are you sure you want to delete ${selectedIds.length} user(s)?`)
    ) {
      return;
    }

    try {
      console.log("Deleting IDs:", selectedIds);

      // TODO: Uncomment when backend is ready
      // await Promise.all(selectedIds.map(id => UsersServices.deleteUser(id)));

      alert(`Deleted ${selectedIds.length} users successfully (Mock)`);

      // TODO: Refresh the table after successful deletion
      // You might want to call handleFetchData or trigger a refresh
    } catch (err) {
      console.error("Error deleting users:", err);
      setError("Failed to delete users. Please try again.");
    }
  }, []);

  return (
    <div className='p-6 space-y-6 w-full'>
      {/* ===== Header Section ===== */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12 md:mb-8'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>User Management</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage, filter, and export user data. Share your filtered view with
            others.
          </p>
        </div>
        <Button className='gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800'>
          <Plus className='h-4 w-4' />
          Create User
        </Button>
      </div>

      {/* ===== Error Alert ===== */}
      {error && (
        <Alert variant='destructive'>
          <AlertDescription className='flex justify-between items-center gap-2'>
            <span>{error}</span>
            <Button
              variant='link'
              className='pl-2 h-auto p-0 text-white underline'
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ===== Data Table ===== */}
      <div className='overflow-hidden'>
        <DataTable
          columns={columns}
          data={data}
          totalRows={rowCount}
          loading={loading}
          onFetch={handleFetchData}
          enableUrlState={true}
          exportFilename='users'
          renderTopToolbar={(selectedRows, search, setSearch) => (
            <div className='flex flex-col w-full lg:w-auto lg:flex-row flex-1 justify-between gap-4'>
              {/* Global Search Input */}
              <GlobalSearchInput
                value={search}
                onChange={setSearch}
                placeholder='Search users...'
                className='w-full lg:max-w-xs'
              />

              {/* Bulk Delete Button - Only shown when rows are selected */}
              {selectedRows.length > 0 && (
                <Button
                  variant='destructive'
                  size='sm'
                  className='gap-2 px-3 h-8'
                  onClick={() => handleBulkDelete(selectedRows)}
                >
                  <Trash2 className='h-4 w-4' />
                  {/* Desktop: Show "Delete" text + count */}
                  <span className=''>Delete Selected</span>
                  <span className=''>({selectedRows.length})</span>
                </Button>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}

export default UserManagement;
