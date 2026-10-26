import React from 'react';
import { Skeleton } from '../../../presentation/components/ui/skeleton';
import { Card } from '../../../presentation/components/ui/card';

export default function UserManagementLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-52 rounded-md" />
          <Skeleton className="h-3.5 w-80 rounded-sm" />
        </div>
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>

      {/* Table Skeleton */}
      <Card className="overflow-hidden border border-border shadow-xs p-0">
        <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="divide-y divide-border/60 p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3.5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

