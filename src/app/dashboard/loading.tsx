import React from 'react';
import { Skeleton } from '../../presentation/components/ui/skeleton';
import { Card } from '../../presentation/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40 rounded-md" />
          <Skeleton className="h-3.5 w-72 rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Sub-navigation Tabs Skeleton */}
      <div className="overflow-x-auto pb-1 max-w-full">
        <div className="inline-flex h-9 items-center rounded-lg bg-muted/60 p-1 gap-1">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-7 w-28 rounded-md" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 space-y-3 border border-border/70">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>

      {/* Main Content Area Skeleton: Left Bar Chart + Right Recent List */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
        {/* Left Bar Chart Card Skeleton */}
        <Card className="lg:col-span-4 p-5 space-y-4 border border-border/70">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="flex h-64 w-full gap-3 pt-6 pb-2">
            {/* Y-axis Ticks Skeleton */}
            <div className="flex flex-col justify-between py-1 w-6 shrink-0">
              <Skeleton className="h-2.5 w-4" />
              <Skeleton className="h-2.5 w-4" />
              <Skeleton className="h-2.5 w-4" />
              <Skeleton className="h-2.5 w-4" />
              <Skeleton className="h-2.5 w-3" />
            </div>
            {/* 12 Vertical Bars Skeleton */}
            <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 px-1 border-b border-border/60">
              {[45, 65, 80, 55, 40, 70, 35, 75, 68, 90, 78, 30].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-2">
                  <Skeleton className="w-full max-w-[26px] rounded-t-sm" style={{ height: `${val}%` }} />
                  <Skeleton className="h-2.5 w-5 rounded-xs" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
        </Card>

        {/* Right Recent Reservations List Skeleton */}
        <Card className="lg:col-span-3 p-5 space-y-4 border border-border/70">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
          <div className="space-y-4 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Skeleton className="h-3 w-10 font-mono" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

