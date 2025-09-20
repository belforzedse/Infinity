"use client";

import ChevronDownIcon from "@/components/Search/Icons/ChevronDownIcon";
import Link from "next/link";
import { useNavigation } from "@/hooks/api/useNavigation";
import { usePathname, useSearchParams } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export default function PLPHeaderDesktopNav() {
  const { navigation, loading } = useNavigation();
  const pathname = usePathname();
  const params = useSearchParams();

  // Transform navigation items to NavItem format
  const navItems: NavItem[] = [
    { label: "خانه", href: "/" },
    ...navigation.map((item) => ({
      label: item.title,
      href: `/plp?category=${item.slug}`,
      hasDropdown: false,
    })),
  ];

  if (loading) {
    return (
      <nav className="bg-stone-50 px-10 py-3">
        <div className="flex items-center justify-center gap-6">
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
          <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-stone-50 px-10 py-3">
      <div className="flex items-center justify-center gap-6">
        {navItems.map((item) => {
          const isHome = item.href === "/" && pathname === "/";
          const isPlp = pathname === "/plp";
          const activeSlug = params.get("category");
          let itemSlug = null;
          try {
            const url = new URL(item.href || "/", "http://dummy");
            itemSlug = url.searchParams.get("category");
          } catch {
            itemSlug = null;
          }
          const isActive =
            isHome || (isPlp && itemSlug && itemSlug === activeSlug);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "pressable text-sm flex items-center underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                isActive
                  ? "rounded-full bg-pink-50 px-3 py-1 text-pink-600"
                  : "text-foreground-primary transition-colors hover:text-pink-500",
              ].join(" ")}
            >
              {item.label}
              {item.hasDropdown && <ChevronDownIcon />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
