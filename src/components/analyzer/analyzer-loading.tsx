"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Loading skeleton shown while a website is being analyzed. */
export function AnalyzerLoading() {
  return (
    <div className="mt-8 grid w-full gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-20 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}