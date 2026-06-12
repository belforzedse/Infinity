/**
 * Centralized role-based access rules for the super-admin area.
 *
 * Single source of truth shared by the sidebar (which parents to hide) and the
 * ClientLayout route guard (which URL prefixes to block). Backend enforcement is
 * the real protection; these rules keep the UI consistent and block direct-URL
 * navigation for the Founder role.
 */

/** Sidebar parent ids hidden from Founders (mirrors the restricted sections). */
export const FOUNDER_HIDDEN_PARENT_IDS = new Set<string>([
  "customization",
  "blog",
  "faq",
  "discounts",
  "stories",
  "users",
  "settings",
]);

/**
 * Route prefixes a Founder must NOT open (even by typing the URL).
 * Note: `/super-admin/reports/product-sales` is intentionally NOT here — it is the
 * single sales report Founders are allowed to view under «گزارشات فروش».
 */
export const FOUNDER_FORBIDDEN_PREFIXES: string[] = [
  "/super-admin/customization",
  "/super-admin/blog",
  "/super-admin/faq",
  "/super-admin/stories",
  "/super-admin/settings",
  "/super-admin/coupons",
  "/super-admin/general-discounts",
  "/super-admin/users",
  "/super-admin/reports/traffic",
  "/super-admin/reports/admin-activity",
];

const normalizeRole = (roleName?: string | null): string =>
  (roleName ?? "").toString().trim().toLowerCase();

/** True when the given role name is the Founder role (case/spacing tolerant). */
export const isFounderRole = (roleName?: string | null): boolean =>
  normalizeRole(roleName) === "founder";

/**
 * Whether a Founder may access the given super-admin pathname.
 * Returns true for any path not matching a forbidden prefix.
 */
export const canFounderAccessPath = (pathname?: string | null): boolean => {
  if (!pathname) return true;
  return !FOUNDER_FORBIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
};
