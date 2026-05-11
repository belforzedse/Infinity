"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bookmark, Home, Plus, Search, User } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

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
  icon: LucideIcon;
  active: boolean;
  ariaLabel: string;
  /** Tailwind text color when this tab is not selected */
  inactiveIconClassName: string;
};

function NavTabLink({
  href,
  icon: Icon,
  active,
  ariaLabel,
  inactiveIconClassName,
}: NavTabLinkProps) {
  const iconClassName = active
    ? "text-infinity-primary"
    : inactiveIconClassName;

  return (
    <Link
      href={href}
      className="flex h-8 w-6 flex-col items-center justify-end gap-2"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        size={24}
        strokeWidth={1.5}
        className={cx("shrink-0 stroke-current", iconClassName)}
        aria-hidden
      />
      <TabIndicator active={active} />
    </Link>
  );
}

function normalizePath(pathname: string | null): string {
  if (!pathname || pathname === "") {
    return "/";
  }
  const trimmed = pathname.replace(/\/$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * Mobile-only bottom bar (Figma 92992 / 92991). LTR item order; hidden from `lg` up.
 * Tab active state follows the current pathname.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const path = normalizePath(pathname);
  const { isAuthenticated, canCreatePost } = useCurrentUser();

  const isBookmarksActive = path === "/profile/bookmarks" || path.startsWith("/profile/bookmarks/");
  const profileHref = isAuthenticated ? "/profile" : "/auth";
  const isProfileActive = isAuthenticated ? path === "/profile" : path.startsWith("/auth");
  const isSearchActive = path === "/search";
  const isHomeActive = path === "/";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 lg:hidden">
      <div className="pointer-events-auto mx-5 mb-5 pb-[env(safe-area-inset-bottom)]">
        <nav
          aria-label="ناوبری اصلی"
          className="flex flex-col items-start gap-[10px] rounded-[20px] bg-white pt-[10px] px-[30px] pb-[5px] shadow-[0_4px_19px_rgba(57,57,57,0.05)]"
          dir="ltr"
        >
          <div className="flex h-16 w-full flex-row items-center justify-between gap-[33px]">
            <NavTabLink
              href="/profile/bookmarks"
              icon={Bookmark}
              active={isBookmarksActive}
              inactiveIconClassName="text-[#A3A3A3]"
              ariaLabel="نشان‌ها"
            />
            <NavTabLink
              href={profileHref}
              icon={User}
              active={isProfileActive}
              inactiveIconClassName="text-[#A49BA0]"
              ariaLabel="پروفایل"
            />
            {canCreatePost ? (
              <Link
                href="/profile/posts/add"
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#566D97_0%,#98BDFF_100%)] shadow-[0_0_5.8px_rgba(0,0,0,0.09)]"
                aria-label="ایجاد پست جدید"
              >
                <Plus size={28} strokeWidth={1.5} className="text-white" aria-hidden />
              </Link>
            ) : (
              <Link
                href="/"
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-infinity-primary shadow-[0_0_5.8px_rgba(0,0,0,0.09)]"
                aria-label="خانه اینفینیتی"
              >
                <img
                  src={INFINITY_MARK_SRC}
                  alt=""
                  width={49}
                  height={49}
                  className="size-[49px] object-contain"
                />
              </Link>
            )}
            <NavTabLink
              href="/search"
              icon={Search}
              active={isSearchActive}
              inactiveIconClassName="text-[#A3A3A3]"
              ariaLabel="جستجو"
            />
            <NavTabLink
              href="/"
              icon={Home}
              active={isHomeActive}
              inactiveIconClassName="text-[#A3A3A3]"
              ariaLabel="خانه"
            />
          </div>
        </nav>
      </div>
    </div>
  );
}
