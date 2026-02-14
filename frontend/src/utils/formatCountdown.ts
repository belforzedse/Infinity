/**
 * Formats remaining time until expiresAt as a short countdown string (e.g. "2س 30د").
 * Used by OrderRow and OrderCard for reserve order countdown display.
 */
export function formatCountdown(expiresAt: string): string {
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}س ${minutes}د`;
}
