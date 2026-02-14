/**
 * Parse a string as a positive integer; return fallback if invalid or non-positive.
 */
export function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
