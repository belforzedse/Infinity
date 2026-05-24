import React from "react";
import { SkeletonBlock, SkeletonText } from "@repo/ui/skeleton";

export default function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
          >
            <SkeletonBlock className="h-20 w-20 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <SkeletonText tone="light" className="h-4 w-1/2" />
              <SkeletonText tone="light" className="h-4 w-1/3" />
              <SkeletonBlock tone="light" className="h-8 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
        <SkeletonText className="h-6 w-32" />
        <SkeletonText tone="light" className="h-4 w-full" />
        <SkeletonText tone="light" className="h-4 w-5/6" />
        <SkeletonBlock tone="light" className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
