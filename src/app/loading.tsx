import React from 'react';
import { Skeleton } from '../presentation/components/ui/skeleton';
import { Card } from '../presentation/components/ui/card';

export default function GenericLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-3.5 w-72 rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Generic Body Card Skeleton */}
      <Card className="p-6 space-y-4 border border-border/70">
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="space-y-3 pt-3">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </Card>
    </div>
  );
}

