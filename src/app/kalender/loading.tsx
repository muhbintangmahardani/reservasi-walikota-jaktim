import React from 'react';
import { Skeleton } from '../../presentation/components/ui/skeleton';

export default function CalendarLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] min-h-[640px] bg-background border border-border rounded-lg overflow-hidden animate-in fade-in duration-200">
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-6 w-36 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>

      {/* Main Container: Left Sidebar + Time Grid Skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Skeleton */}
        <div className="w-64 border-r border-border bg-card/60 p-4 space-y-5 hidden lg:block shrink-0">
          <Skeleton className="h-10 w-full rounded-full" />
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="grid grid-cols-7 gap-1 pt-2">
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton key={i} className="w-7 h-7 rounded-full mx-auto" />
              ))}
            </div>
          </div>
          <div className="space-y-2 pt-3 border-t border-border">
            <Skeleton className="h-4 w-28" />
            <div className="space-y-2 pt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-3.5 h-3.5 rounded" />
                  <Skeleton className="h-3.5 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time Grid Viewport Skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card/30">
          {/* Day Headers */}
          <div className="flex border-b border-border bg-card">
            <div className="w-16 p-2 text-center border-r border-border">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
            <div className="flex-1 grid grid-cols-7 divide-x divide-border">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="p-2 text-center space-y-1">
                  <Skeleton className="h-3 w-8 mx-auto" />
                  <Skeleton className="h-7 w-7 rounded-full mx-auto" />
                </div>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div className="flex flex-1 overflow-hidden">
            <div className="w-16 border-r border-border p-2 space-y-9">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-10 ml-auto" />
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 divide-x divide-border">
              {Array.from({ length: 7 }).map((_, col) => (
                <div key={col} className="p-2 space-y-4">
                  {col % 2 === 0 && (
                    <Skeleton className="h-20 w-full rounded-md mt-10" />
                  )}
                  {col % 3 === 0 && (
                    <Skeleton className="h-28 w-full rounded-md mt-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
