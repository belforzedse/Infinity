"use client";

import ChevronDownIcon from "@/components/Search/Icons/ChevronDownIcon";
import Link from "next/link";
import { useProductCategories } from "@/hooks/useProductCategories";
import { usePathname } from "next/navigation";
import { getCategoryPlpHref } from "@/utils/plpRoutes";
import { StorefrontContainer } from "@/components/storefront";

interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export default function PLPHeaderDesktopNav() {
  const { categories, isLoading: loading } = useProductCategories({ mainOnly: true });
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "خانه", href: "/" },
    ...categories.map((item) => ({
      label: item.name,
      href: getCategoryPlpHref(item.slug),
      hasDropdown: false,
    })),
  ];

  if (loading) {
    return (
      <nav className="bg-stone-50/80 py-3">
        <StorefrontContainer className="flex items-center justify-center gap-6">
          <div className="skeleton-shimmer-light h-5 w-24 rounded"></div>
          <div className="skeleton-shimmer-light h-5 w-24 rounded"></div>
          <div className="skeleton-shimmer-light h-5 w-24 rounded"></div>
        </StorefrontContainer>
      </nav>
    );
  }

  return (
    <nav className="bg-stone-50/80 py-3">
      <StorefrontContainer className="flex items-center justify-center gap-6">
        {navItems.map((item) => {
          const isHome = item.href === "/" && pathname === "/";
          const isActive =
            isHome || (item.href !== "/" && decodeURI(pathname) === decodeURI(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "pressable text-sm flex items-center underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isActive
                  ? "rounded-full bg-infinity-primary-lighter/20 px-3 py-1 text-infinity-primary"
                  : "text-neutral-800 transition-colors hover:text-infinity-primary",
              ].join(" ")}
            >
              {item.label}
              {item.hasDropdown && <ChevronDownIcon />}
            </Link>
          );
        })}
      </StorefrontContainer>
    </nav>
  );
}
