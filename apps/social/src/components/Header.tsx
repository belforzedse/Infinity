"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StorefrontLogo } from "@repo/brand";
import { Bookmark, User } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { HeaderProfileNav } from "@/components/HeaderProfileNav";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { MobileHeaderBackButton } from "@/components/MobileHeaderBackButton";
import { SOCIAL_CONTAINER_CLASS } from "@/components/SocialContainer";

const LG_BREAKPOINT_PX = 1024;
const NEAR_TOP_SCROLL_Y = 80;

function Divider() {
  return <span className="h-6 w-px shrink-0 bg-zinc-200" aria-hidden />;
}

/**
 * App shell header. Desktop: LTR grid search | logo | actions.
 * Mobile (&lt; lg): frosted bar, same `StorefrontLogo` as desktop (smaller), centered; route-aware actions.
 * Mobile: hides on scroll-down, shows on scroll-up or near top (aligned with storefront product layout).
 *
 * Icons: `lucide-react` (same stack as `@repo/frontend`).
 */
export function Header() {
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const { canCreatePost } = useCurrentUser();

  const leadingAction = canCreatePost
    ? {
        href: "/profile",
        label: "پروفایل",
        icon: User,
      }
    : {
        href: "/profile/bookmarks",
        label: "نشان‌ها",
        icon: Bookmark,
      };
  const LeadingActionIcon = leadingAction.icon;

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (window.innerWidth >= LG_BREAKPOINT_PX) {
        lastScrollY.current = currentY;
        setShowHeader(true);
        return;
      }

      const isScrollingUp = currentY <= lastScrollY.current;
      const nearTop = currentY < NEAR_TOP_SCROLL_Y;
      setShowHeader(isScrollingUp || nearTop);
      lastScrollY.current = Math.max(0, currentY);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transform bg-background/35 text-zinc-700 backdrop-blur-md transition-all duration-200 ${
        showHeader ? "translate-y-0" : "-translate-y-full"
      }`}
      dir="ltr"
    >
      {/* Mobile */}
      <div className="relative flex min-h-[4.25rem] items-center px-5 py-2 sm:px-6 lg:hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto" dir="rtl">
            <StorefrontLogo href="/" width={72} height={45} />
          </div>
        </div>
        <div className="relative z-10 ml-auto flex items-center gap-3">
          <NotificationDropdown variant="mobile" />
          <MobileHeaderBackButton />
        </div>
      </div>

      {/* Desktop */}
      <div className={`${SOCIAL_CONTAINER_CLASS} hidden min-h-[4.25rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-2 sm:gap-4 lg:grid`}>
        <div className="flex min-w-0 justify-start">
          <SearchBar aria-label="جستجو" />
        </div>

        <div className="flex shrink-0 justify-center px-1" dir="rtl">
          <StorefrontLogo href="/" width={92} height={58} />
        </div>

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-3 sm:gap-4">
          <Link
            href={leadingAction.href}
            className="rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-zinc-100 hover:text-zinc-800"
            aria-label={leadingAction.label}
          >
            <LeadingActionIcon size={20} strokeWidth={1.5} aria-hidden />
          </Link>
          <Divider />
          <NotificationDropdown variant="desktop" />
          <Divider />
          <HeaderProfileNav />
        </div>
      </div>
    </header>
  );
}
