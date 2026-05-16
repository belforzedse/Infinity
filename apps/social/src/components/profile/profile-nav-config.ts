export type ProfileNavIconKind = "user" | "infinity" | "bookmark" | "bell";

export type ProfileNavMatch = "exact" | "prefix";

export type ProfileNavItem = {
  href: string;
  label: string;
  icon: ProfileNavIconKind;
  match: ProfileNavMatch;
};

export const PROFILE_NAV_ITEMS: readonly ProfileNavItem[] = [
  { href: "/profile", label: "اطلاعات کاربری", icon: "user", match: "exact" },
  { href: "/profile/posts", label: "پست‌های اینفینیتی", icon: "infinity", match: "prefix" },
  {
    href: "/profile/bookmarks",
    label: "ذخیره‌شده‌ها",
    icon: "bookmark",
    match: "prefix",
  },
  {
    href: "/profile/notifications",
    label: "اعلان‌ها",
    icon: "bell",
    match: "prefix",
  },
] as const;

export function isProfileNavActive(pathname: string, href: string, match: ProfileNavMatch): boolean {
  if (match === "exact") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** First item that matches the current path (for mobile pill label / icon). */
export function getActiveProfileNavItem(
  pathname: string,
  items: readonly ProfileNavItem[] = PROFILE_NAV_ITEMS,
): ProfileNavItem {
  const match = items.find((item) => isProfileNavActive(pathname, item.href, item.match));
  return match ?? items[0];
}
