'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface TableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  priority?: number; // Lower number = higher priority on mobile
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  mobileCardView?: boolean; // Use card view on mobile instead of table
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  emptyMessage = "No data available",
  loading = false,
  mobileCardView = true,
}: ResponsiveTableProps<T>) {
  // Sort columns by priority for mobile view
  const sortedColumns = [...columns].sort((a, b) => (a.priority || 999) - (b.priority || 999));
  const mobileColumns = sortedColumns.filter(col => !col.hideOnMobile);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Mobile Card View
  if (mobileCardView) {
    return (
      <>
        {/* Desktop Table View */}
        <div className={clsx("hidden md:block overflow-x-auto rounded-lg border border-gray-200", className)}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={clsx(
                      "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={keyExtractor(item, index)} className="hover:bg-gray-50 transition-colors duration-150">
                  {columns.map((column) => (
                    <td
                      key={`${keyExtractor(item, index)}-${column.key}`}
                      className={clsx("px-6 py-4 whitespace-nowrap text-sm", column.className)}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className={clsx("md:hidden space-y-4", className)}>
          {data.map((item, index) => (
            <div
              key={keyExtractor(item, index)}
              className="bg-white shadow rounded-lg p-4 space-y-3 border border-gray-200"
            >
              {mobileColumns.map((column) => (
                <div key={column.key} className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.header}
                  </span>
                  <span className="mt-1 text-sm text-gray-900">
                    {column.render(item)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  }

  // Mobile-optimized table (horizontal scroll)
  return (
    <div className={clsx("overflow-x-auto -mx-4 sm:mx-0", className)}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={clsx(
                      "px-3 py-3.5 text-left text-sm font-semibold text-gray-900",
                      column.hideOnMobile && "hidden sm:table-cell",
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map((item, index) => (
                <tr key={keyExtractor(item, index)}>
                  {columns.map((column) => (
                    <td
                      key={`${keyExtractor(item, index)}-${column.key}`}
                      className={clsx(
                        "whitespace-nowrap px-3 py-4 text-sm text-gray-500",
                        column.hideOnMobile && "hidden sm:table-cell",
                        column.className
                      )}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}