"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import HomeIcon from "./Icons/HomeIcon";
import CategoryIcon from "./Icons/CategoryIcon";
import BasketIcon from "./Icons/BasketIcon";
import ProfileIcon from "./Icons/ProfileIcon";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { hapticButton } from "@/utils/haptics";
import { ALLOWED_HOME_NAV_CATEGORY_NAME_SUBSTRINGS } from "@/constants/categories";
import { useProductCategories } from "@/hooks/useProductCategories";
import { CATEGORY_IMAGE_PLACEHOLDER } from "@/constants/placeholders";
import { getCategoryPlpHref } from "@/utils/plpRoutes";

const PLPBottomNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const { categories, isLoading: isLoadingCategories } = useProductCategories({
    mainOnly: true,
    featuredOnly: true,
    allowedNameSubstrings: ALLOWED_HOME_NAV_CATEGORY_NAME_SUBSTRINGS,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCategoriesMounted, setIsCategoriesMounted] = useState(false);
  const [isCategoriesVisible, setIsCategoriesVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const bottomPadding = `calc(${isStandalone ? "env(safe-area-inset-bottom)" : "0px"} + 8px)`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
    }
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    setIsAuthenticated(!!accessToken);
  }, []);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    hapticButton();
    if (isAuthenticated) {
      router.push("/account");
    } else {
      router.push("/auth");
    }
  };

  const handleCategoriesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    hapticButton();
    // Mount, then make visible to trigger enter animation
    setIsCategoriesMounted(true);
    requestAnimationFrame(() => setIsCategoriesVisible(true));
  };

  const closeCategories = () => {
    // Start exit animation, then unmount after duration
    setIsCategoriesVisible(false);
    window.setTimeout(() => setIsCategoriesMounted(false), 250);
  };

  // Lock body scroll while the sheet is open
  useEffect(() => {
    if (!isCategoriesMounted) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCategories();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [isCategoriesMounted]);

  const navItems = [
    {
      label: "خانه",
      href: "/",
      icon: (isActive: boolean) => <HomeIcon isActive={isActive} />,
    },
    {
      label: "دسته بندی ها",
      href: "#",
      icon: (isActive: boolean) => <CategoryIcon isActive={isActive} />,
      onClick: handleCategoriesClick,
    },
    {
      label: "سبد خرید",
      href: "/cart",
      icon: (isActive: boolean) => (
        <div className="relative">
          <BasketIcon isActive={isActive} />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-xs font-medium text-white">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </div>
      ),
    },
    {
      label: "حساب کاربری",
      href: isAuthenticated ? "/account" : "/auth",
      icon: (isActive: boolean) => <ProfileIcon isActive={isActive} />,
      onClick: handleProfileClick,
    },
  ];

  return (
    <>
      <nav
        data-bottom-nav
        className="fixed bottom-0 left-0 right-0 z-30 rounded-t-xl border-t border-fuchsia-50 bg-white lg:hidden"
        style={{
          paddingBottom: bottomPadding,
        }}
      >
        <div className="flex items-center justify-between px-4 py-2.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={item.onClick}
                className={`flex w-[74px] flex-col items-center gap-1 p-2 ${
                  isActive ? "rounded-lg bg-pink-50 text-pink-600" : "text-neutral-800"
                }`}
              >
                {item.icon(isActive)}
                <span className="text-xs font-normal">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      {isCategoriesMounted && (
        <div
          className={`fixed inset-0 z-40 flex items-end justify-center transition-opacity duration-200 lg:hidden ${
            isCategoriesVisible ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0"
          }`}
          onClick={closeCategories}
        >
          <div
            className={`duration-250 max-h-[80vh] w-full max-w-screen-sm translate-y-0 rounded-t-2xl bg-white p-4 shadow-2xl transition-transform ease-out ${
              isCategoriesVisible ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ transitionDuration: "250ms" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">دسته بندی ها</h3>
              <button
                aria-label="Close categories"
                onClick={closeCategories}
                className="rounded p-2 text-neutral-500 hover:bg-neutral-100"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 overflow-y-auto pb-2">
              {isLoadingCategories && (
                <div className="col-span-3 text-center text-xs text-neutral-500">
                  در حال بارگذاری...
                </div>
              )}
              {!isLoadingCategories && categories.length === 0 && (
                <div className="col-span-3 text-center text-xs text-neutral-500">
                  دسته‌بندی برای نمایش وجود ندارد.
                </div>
              )}
              {!isLoadingCategories &&
                categories.map((category) => {
                  const imageSrc = category.imageUrl || CATEGORY_IMAGE_PLACEHOLDER;
                  const label = category.name || category.slug;
                  const bgColor = category.color?.trim() || "#f8fafc";

                  return (
                    <Link
                      key={category.id}
                      href={getCategoryPlpHref(category.slug)}
                      onClick={closeCategories}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="relative h-20 w-20 overflow-hidden rounded-full"
                        style={{ backgroundColor: bgColor }}
                      >
                        <Image
                          src={imageSrc}
                          alt={category.imageAlt || label}
                          fill
                          className="object-contain p-4"
                          sizes="80px"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-xs">{label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PLPBottomNavigation;
