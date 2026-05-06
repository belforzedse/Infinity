/**
 * Shared constants for order display (reserve page, orders Tabs).
 * Use these so image base URL and placeholder are consistent across OrderCard/OrderRow.
 */

export const IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "https://api.infinitycolor.co/";

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3C/svg%3E";
