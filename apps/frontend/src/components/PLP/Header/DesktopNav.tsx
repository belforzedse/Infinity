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
      <nav className="bg-stone-50 py-3">
        <StorefrontContainer className="flex items-center justify-center gap-6">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
        </StorefrontContainer>
      </nav>
    );
  }

  return (
    <nav className="bg-stone-50 py-3">
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
                "pressable text-sm flex items-center underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isActive
                  ? "rounded-full bg-pink-50 px-3 py-1 text-pink-600"
                  : "text-neutral-800 transition-colors hover:text-pink-500",
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
