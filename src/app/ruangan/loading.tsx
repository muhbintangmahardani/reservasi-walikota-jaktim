import React from 'react';
import { Skeleton } from '../../presentation/components/ui/skeleton';
import { Card, CardContent } from '../../presentation/components/ui/card';

export default function RoomsLoading() {
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

      {/* Filter and Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Skeleton className="h-8 w-full sm:w-72 rounded-md" />
        <Skeleton className="h-8 w-full sm:w-40 rounded-md" />
      </div>

      {/* 6 Room Cards Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden space-y-3 p-4 border border-border/70">
            <Skeleton className="h-36 w-full rounded-md" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <div className="flex gap-1.5 pt-2 border-t border-border/40">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

