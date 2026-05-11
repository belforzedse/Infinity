/**
 * Persian-friendly slug derivation for `api::post.post.Slug`.
 *
 * Backend constraint: `Slug` is unique + `maxLength: 150`. We preserve Persian
 * letters (Strapi accepts them as-is) and strip only ASCII punctuation + whitespace
 * so the slug stays readable in the URL bar without needing a transliteration dep.
 *
 * `withUniqueSuffix` appends a short base-36 timestamp so two posts with the
 * same title don't collide on the unique index server-side.
 */

const SLUG_MAX_LENGTH = 150;
const SUFFIX_SEPARATOR = "-";

/**
 * Normalise raw user input into a slug body. Does NOT add the uniqueness suffix —
 * call `withUniqueSuffix` for that, or use `autoSlug` for the full pipeline.
 */
export function slugifyBody(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_/.,!?;:'"`~@#$%^&*()+=\[\]{}<>|\\]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH);
}

/**
 * Append a short timestamp suffix and clamp to the schema limit. The suffix is
 * `Date.now().toString(36)` — 8 lowercase alphanumeric chars at present, which
 * is enough to keep collisions astronomically unlikely without external deps.
 */
export function withUniqueSuffix(body: string): string {
  const suffix = Date.now().toString(36);
  const prefix = body || "post";
  const headroom = SLUG_MAX_LENGTH - SUFFIX_SEPARATOR.length - suffix.length;
  const head = prefix.slice(0, Math.max(1, headroom));
  return `${head}${SUFFIX_SEPARATOR}${suffix}`;
}

/**
 * Title → unique slug in one call. Use for the auto-derived field as the user
 * types and as the publish-time fallback when the slug field is empty.
 */
export function autoSlug(title: string): string {
  return withUniqueSuffix(slugifyBody(title));
}
