import React from "react";
import { StorefrontGrid } from "@/components/storefront";

export default function ProductListSkeleton() {
  return (
    <>
      {/* Desktop grid skeleton */}
      <div className="hidden gap-6 md:grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </aside>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
            <div className="h-9 w-40 animate-pulse rounded-full bg-gray-200" />
          </div>
          <StorefrontGrid variant="plp">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[250/270] w-full animate-pulse rounded-2xl bg-gray-200" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </StorefrontGrid>
        </div>
      </div>

      {/* Mobile list skeleton */}
      <div className="flex flex-col gap-3 md:hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <div className="h-28 w-24 shrink-0 animate-pulse rounded-2xl bg-gray-200" />
            <div className="flex flex-1 flex-col justify-between py-1">
              <div className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-8 w-28 animate-pulse rounded-full bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
