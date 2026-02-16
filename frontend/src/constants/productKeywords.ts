/**
 * Keywords used to boost products in featured sections (جدیدترین ها, تخفیف های وسوسه انگیز).
 * Products whose title contains any of these (case-insensitive) appear first.
 *
 * Add or remove keywords here to change which products are prioritized.
 */
export const PRODUCT_BOOST_KEYWORDS: readonly string[] = [
  "G",
  "G0020",
  "W0069",
  "W0043",
  "W0039",
  "W0096",
  "W002",
  "W0042",
  "W0018",
  "W0036",
  "W009",
  "W0010",
  "W0035",
  "G0015",
  "G0018",
  "W0030",
  "G004",
  "G005",
  "G006",
  "G003",
  "G007",
  "W0022",
  "W0029",
  "G0017",
  "W0025",
  "W0014",
  "W0033",
  "G0023",
  "G0024",
  "G0013",
  "W0012",
  "W0027",
  "W008",
  "W0024",
  "W0031",
  "W004",
  "W0015",
  "G002",
  "W0076",
  "W0087",
  "W0089",
  "G009",
  "G0011",
  "G0019",
  "G0030",
  "G0021",
  "G008",
  "G0022",
  "G0035",
  "G0031",
  "G0036",
  "W007",
  "G001",
  "W0058",
  "G0014",
  "G0029",
  "G0039",
  "G0038",
  "W005",
  "W0032",
  "W0038",
  "W0080",
  "G0028",
  "G00101",
  "G0098",
  "G0096",
];

export type ProductBoostKeyword = string;

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
