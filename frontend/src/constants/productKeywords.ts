/**
 * Keywords used to boost products in featured sections (جدیدترین ها, تخفیف های وسوسه انگیز).
 * Products whose title contains any of these (case-insensitive) appear first.
 *
 * Add or remove keywords here to change which products are prioritized.
 */
export const PRODUCT_BOOST_KEYWORDS = ["G"] as const;

export type ProductBoostKeyword = (typeof PRODUCT_BOOST_KEYWORDS)[number];

/**
 * Builds Strapi $containsi filter for product Title matching any keyword.
 * Single keyword: filters[Title][$containsi]=X
 * Multiple keywords: filters[$or][0][Title][$containsi]=X&filters[$or][1][Title][$containsi]=Y
 */
export function buildTitleKeywordFilter(): string {
  const keywords = PRODUCT_BOOST_KEYWORDS;
  if (keywords.length === 0) return "";
  if (keywords.length === 1) {
    return `filters[Title][$containsi]=${encodeURIComponent(keywords[0])}`;
  }
  return keywords
    .map((kw, i) => `filters[$or][${i}][Title][$containsi]=${encodeURIComponent(kw)}`)
    .join("&");
}
