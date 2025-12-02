import React from "react";

export default function ProductListSkeleton() {
  return (
    <>
      {/* Desktop grid skeleton */}
      <div className="hidden grid-cols-2 gap-4 md:grid lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-72 w-full animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>

      {/* Mobile list skeleton */}
      <div className="flex flex-col gap-3 md:hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 w-full animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </>
  );
}
