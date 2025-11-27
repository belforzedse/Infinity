/**
 * Create slugs that keep Persian characters (and standard ASCII) intact.
 */
export function generateUnicodeSlug(text: string, fallbackPrefix = "slug"): string {
  if (!text) {
    return `${fallbackPrefix}-${Date.now()}`;
  }

  const slug = text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, "-") // Convert spaces and ZWNJ to hyphen
    .replace(/[^0-9a-z\u0600-\u06ff-]/gi, "") // Keep ASCII letters/numbers and Persian letters
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens

  return slug || `${fallbackPrefix}-${Date.now()}`;
}
