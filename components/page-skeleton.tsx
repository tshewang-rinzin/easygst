import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generic page loading skeleton used by loading.tsx files.
 * Shows a header area + card/table placeholder.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>

      {/* Table / content area */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="border-b p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        {/* Table rows */}
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-48 flex-1" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Simpler skeleton for form/detail pages.
 */
export function FormSkeleton() {
  return (
    <div className="space-y-6 p-1">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4 rounded-lg border p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="mt-4 h-10 w-32" />
      </div>
    </div>
  );
}

/**
 * Dashboard-specific skeleton with charts.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-1">
      <Skeleton className="h-8 w-48" />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>

      {/* Recent items */}
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

/**
 * Settings skeleton.
 */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6 p-1">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="space-y-4 rounded-lg border p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
