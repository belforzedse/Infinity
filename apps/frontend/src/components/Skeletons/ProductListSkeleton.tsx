import React from "react";
import { StorefrontGrid } from "@/components/storefront";
import { SkeletonBlock, SkeletonMedia, SkeletonText } from "@repo/ui/skeleton";

export default function ProductListSkeleton() {
  return (
    <>
      {/* Desktop grid skeleton */}
      <div className="hidden gap-6 md:grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <SkeletonText className="h-5 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBlock tone="light" className="h-4 w-4 rounded" />
              <SkeletonText tone="light" className="h-4 flex-1" />
            </div>
          ))}
        </aside>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonText className="h-6 w-36" />
            <SkeletonBlock tone="light" className="h-9 w-40 rounded-full" />
          </div>
          <StorefrontGrid variant="plp">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <SkeletonMedia aspect="250 / 270" />
                <SkeletonText tone="light" className="h-4 w-3/4" />
                <SkeletonText tone="light" className="h-4 w-1/2" />
              </div>
            ))}
          </StorefrontGrid>
        </div>
      </div>

      {/* Mobile list skeleton */}
      <div className="flex flex-col gap-3 md:hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
            <SkeletonBlock className="h-28 w-24 shrink-0 rounded-2xl" />
            <div className="flex flex-1 flex-col justify-between py-1">
              <div className="space-y-2">
                <SkeletonText tone="light" className="h-4 w-3/4" />
                <SkeletonText tone="light" className="h-4 w-1/2" />
              </div>
              <SkeletonBlock tone="light" className="h-8 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
