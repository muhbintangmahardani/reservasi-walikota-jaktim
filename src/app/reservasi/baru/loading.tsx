import React from 'react';
import { Skeleton } from '../../../presentation/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '../../../presentation/components/ui/card';

export default function NewReservationLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-3.5 w-72 rounded-sm" />
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>

      {/* Form Card Skeleton */}
      <Card className="border border-border/70 p-6 space-y-6">
        {/* Section 1: Jadwal */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>

        {/* Section 2: Ruangan */}
        <div className="space-y-3 pt-3 border-t border-border/60">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-3 w-3/4" />
        </div>

        {/* Section 3: Detail Acara */}
        <div className="space-y-3 pt-3 border-t border-border/60">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <Skeleton className="h-3.5 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      </Card>
    </div>
  );
}

