import React from "react";

export default function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg bg-white p-4 shadow animate-pulse"
        >
          <div className="h-16 w-16 rounded bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-1/3 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

