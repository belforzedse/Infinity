import React from "react";
import { StorefrontGrid } from "@/components/storefront";

export default function ProductListSkeleton() {
  return (
    <>
      {/* Desktop grid skeleton */}
      <StorefrontGrid variant="plp" className="hidden md:grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[250/270] w-full animate-pulse rounded-lg bg-gray-200" />
        ))}
      </StorefrontGrid>

      {/* Mobile list skeleton */}
      <div className="flex flex-col gap-3 md:hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 w-full animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </>
  );
}
