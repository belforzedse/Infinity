/**
 * Create slugs that keep Persian characters (and standard ASCII) intact.
 * Persian characters are preserved as-is, only ASCII letters are lowercased.
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
