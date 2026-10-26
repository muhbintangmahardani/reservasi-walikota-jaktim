import React from 'react';
import { Skeleton } from '../../presentation/components/ui/skeleton';
import { Card, CardContent } from '../../presentation/components/ui/card';

export default function VerificationLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-52 rounded-md" />
          <Skeleton className="h-3.5 w-80 rounded-sm" />
        </div>
        <Skeleton className="h-9 w-64 rounded-lg" />
      </div>

      {/* Verification Items Skeleton List */}
      <div className="space-y-3.5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 sm:p-5 space-y-3.5 border border-border/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3.5 w-28" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

