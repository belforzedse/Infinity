"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import HomeIcon from "./Icons/HomeIcon";
import CategoryIcon from "./Icons/CategoryIcon";
import BasketIcon from "./Icons/BasketIcon";
import ProfileIcon from "./Icons/ProfileIcon";
import { useCart } from "@/contexts/CartContext";
import { hapticButton } from "@/utils/haptics";
import { ALLOWED_HOME_NAV_CATEGORY_NAME_SUBSTRINGS } from "@/constants/categories";
import { useProductCategories } from "@/hooks/useProductCategories";
import { CATEGORY_IMAGE_PLACEHOLDER } from "@/constants/placeholders";
import { getCategoryPlpHref } from "@/utils/plpRoutes";

const INFINITY_MARK_SRC = "/Infinity.svg";

function cx(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

function TabIndicator({ active }: { active: boolean }) {
  return (
    <span
      className={cx(
        "h-[3px] w-[17px] shrink-0 rounded-full",
        active ? "bg-infinity-primary" : "bg-black/[0.08]",
      )}
      aria-hidden
    />
  );
}

type NavTabLinkProps = {
  href: string;
  active: boolean;
  ariaLabel: string;
  inactiveIconClassName: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
};

function NavTabLink({
  href,
  active,
  ariaLabel,
  inactiveIconClassName,
  onClick,
  children,
}: NavTabLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cx(
        "flex h-8 w-6 flex-col items-center justify-end gap-2",
        active ? "text-infinity-primary" : inactiveIconClassName,
      )}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
    >
      {children}
      <TabIndicator active={active} />
    </Link>
  );
}

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

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    setIsAuthenticated(!!accessToken);
  }, []);

  const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    hapticButton();
    if (isAuthenticated) {
      router.push("/account");
    } else {
      router.push("/auth");
    }
  };

  const handleCategoriesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    hapticButton();
    setIsCategoriesMounted(true);
    requestAnimationFrame(() => setIsCategoriesVisible(true));
  };

  const closeCategories = () => {
    setIsCategoriesVisible(false);
    window.setTimeout(() => setIsCategoriesMounted(false), 250);
  };

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

  const profileHref = isAuthenticated ? "/account" : "/auth";
  const isHomeActive = pathname === "/";
  const isCartActive = pathname === "/cart";
  const isProfileActive = isAuthenticated
    ? pathname === "/account" || pathname.startsWith("/account/")
    : pathname.startsWith("/auth");

  return (
    <>
      <div
        data-bottom-nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden"
      >
        <div className="pointer-events-auto mx-5 mb-3 pb-[env(safe-area-inset-bottom)]">
          <nav
            aria-label="ناوبری اصلی"
            className="flex flex-col items-start gap-[10px] rounded-[20px] bg-white pt-[10px] px-[30px] pb-[5px] shadow-[0_4px_19px_rgba(57,57,57,0.05)]"
            dir="ltr"
          >
            <div className="flex h-16 w-full flex-row items-center justify-between gap-[33px]">
              <NavTabLink
                href={profileHref}
                active={isProfileActive}
                inactiveIconClassName="text-[#A49BA0]"
                ariaLabel="حساب کاربری"
                onClick={handleProfileClick}
              >
                <ProfileIcon className="shrink-0 stroke-current" />
              </NavTabLink>

              <NavTabLink
                href="/cart"
                active={isCartActive}
                inactiveIconClassName="text-[#A3A3A3]"
                ariaLabel="سبد خرید"
              >
                <div className="relative">
                  <BasketIcon className="shrink-0 stroke-current" />
                  {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-infinity-primary text-[10px] font-medium text-white">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </div>
              </NavTabLink>

              <a
                href="https://infinitygram.co"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="اینفینیتی‌گرام"
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#566D97_0%,#98BDFF_100%)] shadow-[0_0_5.8px_rgba(0,0,0,0.09)]"
              >
                <img
                  src={INFINITY_MARK_SRC}
                  alt=""
                  width={49}
                  height={49}
                  className="size-[49px] object-contain"
                />
              </a>

              <NavTabLink
                href="#"
                active={false}
                inactiveIconClassName="text-[#A3A3A3]"
                ariaLabel="دسته بندی ها"
                onClick={handleCategoriesClick}
              >
                <CategoryIcon className="shrink-0 stroke-current" />
              </NavTabLink>

              <NavTabLink
                href="/"
                active={isHomeActive}
                inactiveIconClassName="text-[#A3A3A3]"
                ariaLabel="خانه"
              >
                <HomeIcon className="shrink-0 stroke-current" />
              </NavTabLink>
            </div>
          </nav>
        </div>
      </div>

      {isCategoriesMounted && (
        <div
          className={`fixed inset-0 z-40 flex items-end justify-center transition-opacity duration-200 lg:hidden ${
            isCategoriesVisible ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0"
          }`}
          onClick={closeCategories}
        >
          <div
            className={`luxury-glass-panel duration-250 max-h-[80vh] w-full max-w-screen-sm translate-y-0 rounded-t-2xl bg-white/80 p-4 shadow-2xl transition-transform ease-out ${
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
                className="pressable luxury-glass-chip rounded-full p-2 text-neutral-500 hover:text-neutral-800"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 overflow-y-auto pb-2">
              {isLoadingCategories &&
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="skeleton-shimmer h-20 w-20 rounded-full" />
                    <div className="skeleton-shimmer-light h-3 w-16 rounded" />
                  </div>
                ))}
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
                      className="pressable flex flex-col items-center gap-2"
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
