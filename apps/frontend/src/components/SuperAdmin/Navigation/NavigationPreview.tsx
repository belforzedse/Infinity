"use client";

import Link from "next/link";
import type { NavigationCategory } from "@/types/super-admin/navigation";

type ProductCategoriesInput = NavigationCategory[] | string;

function parseCategories(value: ProductCategoriesInput): NavigationCategory[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type Props = {
  product_categories: ProductCategoriesInput;
};

/**
 * Renders the same structure and styles as PLPHeaderDesktopNav so the
 * super-admin preview matches the live site navigation.
 */
export default function NavigationPreview({ product_categories }: Props) {
  const categories = parseCategories(product_categories);

  const navItems: { key: string; label: string; href: string }[] = [
    { key: "home", label: "خانه", href: "/" },
    ...categories.map((cat) => ({
      key: `cat-${cat.id}`,
      label: cat.title || cat.slug || "—",
      href: `/plp?category=${encodeURIComponent(cat.slug)}`,
    })),
  ];

  return (
    <div className="w-full border-b border-slate-200 bg-white">
      <nav
        className="bg-stone-50 px-6 py-3 sm:px-10"
        aria-label="منوی ناوبری"
      >
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              prefetch={item.href === "/"}
              className="pressable text-foreground-primary flex items-center text-sm underline-offset-4 transition-colors hover:text-pink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              onClick={(e) => e.preventDefault()}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-2 bg-slate-50/80" aria-hidden />
    </div>
  );
}
