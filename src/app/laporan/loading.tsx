import React from 'react';
import { Skeleton } from '../../presentation/components/ui/skeleton';
import { Card } from '../../presentation/components/ui/card';

export default function ReportLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-52 rounded-md" />
          <Skeleton className="h-3.5 w-80 rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Table Report Skeleton Card */}
      <Card className="overflow-hidden border border-border shadow-xs p-0">
        <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="divide-y divide-border/60 p-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="p-3 flex items-center justify-between gap-4">
              <Skeleton className="h-3.5 w-6 font-mono" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

