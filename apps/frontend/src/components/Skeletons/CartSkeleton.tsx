import React from "react";

export default function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="h-20 w-20 rounded-2xl bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-4 w-1/3 rounded bg-gray-200" />
              <div className="h-8 w-28 rounded-full bg-gray-200" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
        <div className="h-12 w-full animate-pulse rounded-full bg-gray-200" />
      </div>
    </div>
  );
}
