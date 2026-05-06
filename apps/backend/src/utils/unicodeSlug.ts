/**
 * Generate a URL-friendly slug from the given text while preserving Persian characters and lowercasing only ASCII letters.
 *
 * @param text - The source string to convert into a slug.
 * @param fallbackPrefix - Prefix used when `text` is falsy or the resulting slug is empty; combined with the current timestamp.
 * @returns The slug containing digits, lowercase ASCII letters, Persian characters (U+0600–U+06FF), and hyphens; if no slug can be produced returns `${fallbackPrefix}-{timestamp}`.
 */
export function generateUnicodeSlug(text: string, fallbackPrefix = "slug"): string {
  if (!text) {
    return `${fallbackPrefix}-${Date.now()}`;
  }

  // First, replace spaces and ZWNJ with hyphens
  let slug = text
    .toString()
    .trim()
    .replace(/[\s\u200c]+/g, "-"); // Convert spaces and ZWNJ to hyphen

  // Lowercase only ASCII letters (a-z), preserve Persian characters
  slug = slug.replace(/[A-Z]/g, (char) => char.toLowerCase());

  // Remove unwanted characters but keep ASCII letters/numbers, Persian letters, and hyphens
  slug = slug.replace(/[^0-9a-z\u0600-\u06ff-]/gi, "");

  // Collapse multiple hyphens
  slug = slug.replace(/-+/g, "-");

  // Trim leading/trailing hyphens
  slug = slug.replace(/^-|-$/g, "");

  return slug || `${fallbackPrefix}-${Date.now()}`;
}