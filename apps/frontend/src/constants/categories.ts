/**
 * Category name substrings used as fallback filter when "Featured" is not used.
 * Includes مانتو and پلیور so they match Strapi category names; used for
 * homepage carousel and bottom nav sheet when featuredOnly is false.
 */
export const ALLOWED_HOME_NAV_CATEGORY_NAME_SUBSTRINGS: readonly string[] = [
  "کیف",
  "دامن",
  "کت",
  "لباس زیر",
  "شال و روسری",
  "پیراهن",
  "شلوار",
  "مانتو",
  "پلیور",
];
