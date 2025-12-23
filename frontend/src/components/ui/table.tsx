"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

// Table Components
function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

function TableRow({
  className,
  selected,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        selected && "bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  sortable,
  sortDirection,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | undefined;
}) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        sortable && "cursor-pointer select-none hover:bg-muted/50 transition-colors",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {props.children}
        {sortable && (
          <span className="inline-flex h-4 w-4 items-center justify-center">
            {sortDirection === "asc" ? (
              <ChevronUp className="h-4 w-4" />
            ) : sortDirection === "desc" ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      data-slot="table-cell"
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

// Checkbox Component for Row Selection
function TableCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer",
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        className
      )}
      checked={checked}
      data-state={indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  );
}

// DataTable Component with full features
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  showSearch?: boolean;
  showColumnToggle?: boolean;
  showPageSizeSelect?: boolean;
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;
  onDataChange?: (data: TData[]) => void;
}

function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableRowSelection = true,
  enableColumnVisibility = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 50, 100],
  showSearch = true,
  showColumnToggle = true,
  showPageSizeSelect = true,
  className,
  isLoading = false,
  emptyMessage = "No data available",
  onRowClick,
  onSelectionChange,
  onDataChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns: enableRowSelection
      ? [
          {
            id: "select",
            header: ({ table }) => (
              <TableCheckbox
                checked={table.getIsAllRowsSelected()}
                indeterminate={table.getIsSomeRowsSelected()}
                onCheckedChange={(value) => table.toggleAllRowsSelected(value)}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <TableCheckbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(value)}
                aria-label="Select row"
              />
            ),
            enableSorting: false,
            enableFiltering: false,
          },
          ...columns,
        ]
      : columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, table, onSelectionChange]);

  // Notify parent of data changes
  React.useEffect(() => {
    if (onDataChange) {
      onDataChange(data);
    }
  }, [data, onDataChange]);

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        {showSearch && searchKey && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Column Visibility Toggle */}
          {showColumnToggle && table.getAllColumns().some((col) => col.getCanHide()) && (
            <Select
              value=""
              onValueChange={() => {
                const visibleColumns = table.getAllColumns().filter((col) => col.getIsVisible());
                const allVisible = visibleColumns.length === table.getAllColumns().length;
                table.getAllColumns().forEach((col) => {
                  if (col.id !== "select") {
                    col.toggleVisibility(!allVisible);
                  }
                });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Columns" />
              </SelectTrigger>
              <SelectContent>
                <div className="max-h-[300px] overflow-auto">
                  {table.getAllColumns()
                    .filter((col) => col.id !== "select")
                    .map((col) => (
                      <div
                        key={col.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          col.toggleVisibility(!col.getIsVisible());
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={col.getIsVisible()}
                          onChange={(e) => {
                            e.stopPropagation();
                            col.toggleVisibility(e.target.checked);
                          }}
                          className="h-4 w-4 rounded"
                        />
                        <span className="text-sm">{col.columnDef.header as string || col.id}</span>
                      </div>
                    ))}
                </div>
              </SelectContent>
            </Select>
          )}

          {/* Page Size Select */}
          {showPageSizeSelect && (
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Selection Action Bar */}
      {selectedCount > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedCount} row{selectedCount > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.resetRowSelection()}
                >
                  Clear selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = enableSorting && header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <TableHead
                      key={header.id}
                      sortable={isSortable}
                      sortDirection={sortDirection}
                      onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (enableRowSelection ? 1 : 0)} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  selected={row.getIsSelected()}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + (enableRowSelection ? 1 : 0)} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Badge variant="secondary">
              {table.getFilteredRowModel().rows.length} total rows
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to create sortable columns
function createSortableColumn<T>(
  accessorKey: keyof T | string,
  header: string,
  cell?: (row: T) => React.ReactNode
): ColumnDef<T> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: cell ? ({ row }) => cell(row.original) : undefined,
  };
}

// Export all components
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableCheckbox,
  DataTable,
  createSortableColumn,
};
