"use client";

import { Skeleton } from '@/components/ui/Skeleton';

export function UnclaimedProfilesSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-96 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-charcoal/20">
        <table className="min-w-full divide-y divide-charcoal/10">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3"><Skeleton className="h-4 w-4" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-24" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-32" /></th>
              <th className="px-6 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-charcoal/10">
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                <td className="px-6 py-4"><Skeleton className="h-4 w-4" /></td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                <td className="px-6 py-4">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </td>
                <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-gray-50 border border-charcoal/10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}