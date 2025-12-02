// Legacy product title filter helper.
// Currently unused, but kept for future reference when we need to
// scope product listings down to specific keywords.
export const PRODUCT_TITLE_FILTER =
  "&filters[$or][0][Title][$containsi]=کیف" +
  "&filters[$or][1][Title][$containsi]=کفش" +
  "&filters[$or][2][Title][$containsi]=صندل" +
  "&filters[$or][3][Title][$containsi]=کتونی" +
  "&filters[$or][4][Title][$containsi]=ونس";

export function appendTitleFilter(endpoint: string) {
  return `${endpoint}${PRODUCT_TITLE_FILTER}`;
}
