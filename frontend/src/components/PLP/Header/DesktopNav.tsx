"use client";

import ChevronDownIcon from "@/components/Search/Icons/ChevronDownIcon";
import Link from "next/link";
import { useNavigation } from "@/hooks/api/useNavigation";

interface NavItem {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export default function PLPHeaderDesktopNav() {
  const { navigation, loading } = useNavigation();

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
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="pressable text-sm flex items-center text-foreground-primary underline-offset-4 transition-colors hover:text-pink-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {item.label}
            {item.hasDropdown && <ChevronDownIcon />}
          </Link>
        ))}
      </div>
    </nav>
  );
}
