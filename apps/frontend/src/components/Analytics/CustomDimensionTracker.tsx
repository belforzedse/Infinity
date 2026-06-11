"use client";

import { useEffect } from "react";
import { setCustomDimension, type CustomDimensionKey } from "@/lib/analytics/matomo";

type Props = {
  dimension: CustomDimensionKey;
  value: string | number;
};

/**
 * Sets a single action-scoped Matomo custom dimension for the current page from
 * a server component (e.g. the stable category slug on category PLP pages). Safe
 * and no-op when analytics is disabled.
 */
export default function CustomDimensionTracker({ dimension, value }: Props) {
  useEffect(() => {
    if (value === undefined || value === null || value === "") return;
    setCustomDimension(dimension, value);
  }, [dimension, value]);

  return null;
}
