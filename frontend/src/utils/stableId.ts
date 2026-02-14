/**
 * Generates a stable unique ID for client-side use (e.g. DnD item keys).
 * Uses crypto.randomUUID() when available, otherwise a short random string.
 */
export function generateStableId(prefix = "image-"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}${crypto.randomUUID()}`;
  }
  return `${prefix}${Math.random().toString(36).slice(2, 11)}`;
}
