import React from 'react';
import { Skeleton } from '../../presentation/components/ui/skeleton';
import { Card } from '../../presentation/components/ui/card';

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Skeleton */}
      <div className="pb-3 border-b border-border/60 space-y-1.5">
        <Skeleton className="h-6 w-48 rounded-md" />
        <Skeleton className="h-3.5 w-72 rounded-sm" />
      </div>

      {/* Profile Card Skeleton */}
      <Card className="p-6 space-y-5 border border-border/70">
        <div className="flex items-center gap-4 pb-4 border-b border-border/60">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-48" />
          </div>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>

        <div className="pt-3 border-t border-border/60 flex justify-end">
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </Card>
    </div>
  );
}

