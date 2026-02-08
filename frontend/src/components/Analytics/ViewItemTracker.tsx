"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackFunnelStep } from "@/lib/analytics/matomo";

type Props = {
  productId: number;
  title: string;
  price?: number;
};

export default function ViewItemTracker({ productId, title, price }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!productId) return;
    trackFunnelStep("view_item", {
      label: `${productId}:${title}`,
      value: price,
      onceKey: `view-item:${productId}:${pathname}`,
    });
  }, [productId, title, price, pathname]);

  return null;
}
