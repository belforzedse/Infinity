// Product title filters used throughout the app
// Matches titles that contain کیف, کفش, صندل, or کتونی (case-insensitive, substring)
export const PRODUCT_TITLE_FILTER =
  "&filters[$or][0][Title][$containsi]=کیف&filters[$or][1][Title][$containsi]=کفش&filters[$or][2][Title][$containsi]=صندل&filters[$or][3][Title][$containsi]=کتونی";

/**
 * Helper to append the product title filter to an endpoint safely.
 * If `endpoint` already contains query params, it will append directly.
 */
export function appendTitleFilter(endpoint: string) {
  // The filter string already starts with '&', so just append
  return `${endpoint}${PRODUCT_TITLE_FILTER}`;
}
