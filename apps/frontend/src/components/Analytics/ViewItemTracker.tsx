"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setCustomDimension, trackFunnelStep } from "@/lib/analytics/matomo";

type Props = {
  productId: number;
  title: string;
  price?: number;
};

export default function ViewItemTracker({ productId, title, price }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!productId) return;
    // Attach the stable product id to this product-view action so Matomo reports
    // can segment behaviour by product (action-scoped dimension).
    setCustomDimension("productId", productId);
    trackFunnelStep("view_item", {
      label: `${productId}:${title}`,
      value: price,
      onceKey: `view-item:${productId}:${pathname}`,
    });
  }, [productId, title, price, pathname]);

  return null;
}
