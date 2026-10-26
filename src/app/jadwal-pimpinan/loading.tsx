import React from 'react';
import { Skeleton } from '../../presentation/components/ui/skeleton';
import { Card } from '../../presentation/components/ui/card';

export default function JadwalPimpinanLoading() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      <div className="space-y-1.5 pb-4 border-b border-border/60">
        <Skeleton className="h-6 w-64 rounded-md" />
        <Skeleton className="h-3.5 w-96 rounded-sm" />
      </div>

      <Skeleton className="h-14 w-full rounded-xl" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

