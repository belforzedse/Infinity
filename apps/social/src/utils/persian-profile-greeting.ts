/** Arabic letter alef (U+0627) */
const ALEF = "\u0627";
/** Persian ye / Farsi yeh (U+06CC) */
const FARSI_YEH = "\u06CC";

/**
 * Builds the header greeting: `{firstName} عزیز`, with one ی after names ending in ا
 * (e.g. رضا → رضای عزیز — a single U+06CC, not a double-ye spelling).
 */
export function buildPersianProfileGreeting(firstName: string): string {
  const trimmed = firstName.trim();
  if (!trimmed) return "";

  const display = trimmed.endsWith(ALEF) ? `${trimmed}${FARSI_YEH}` : trimmed;
  return `${display} عزیز`;
}
