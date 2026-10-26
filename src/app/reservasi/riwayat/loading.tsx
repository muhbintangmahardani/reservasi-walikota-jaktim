import React from 'react';
import { Skeleton } from '../../../presentation/components/ui/skeleton';
import { Card } from '../../../presentation/components/ui/card';

export default function ReservationHistoryLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-52 rounded-md" />
          <Skeleton className="h-3.5 w-80 rounded-sm" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      {/* History Items Skeleton List */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 sm:p-5 space-y-3 border border-border/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-4 pt-1">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

