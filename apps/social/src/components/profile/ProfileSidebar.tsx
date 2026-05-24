"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems, MenuSeparator } from "@headlessui/react";
import { Bell, Bookmark, ChevronDown, LogOut, User } from "lucide-react";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";
import { InfinityMarkCircle } from "@/components/InfinityMarkCircle";
import { glassDefaultCrossfadeSurface } from "@repo/ui/glass";
import {
  PROFILE_NAV_ITEMS,
  getActiveProfileNavItem,
  isProfileNavActive,
  type ProfileNavIconKind,
} from "@/components/profile/profile-nav-config";
import { performLogout } from "@/utils/logout";
import { useCurrentUser } from "@/hooks/use-current-user";

const glassActiveNav = glassDefaultCrossfadeSurface("before:rounded-[19px]", "after:rounded-[19px]");

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const labelClass =
  "font-peyda text-base font-medium leading-5 tracking-[0.3px] text-[#424242]";

function NavIcon({ kind }: { kind: ProfileNavIconKind }) {
  if (kind === "infinity") {
    return <InfinityMarkCircle circleSize={24} markSize={15} />;
  }
  const iconClass = "size-6 shrink-0 stroke-[1.2] text-[#94A3B8]";
  if (kind === "user") {
    return <User className={iconClass} aria-hidden />;
  }
  if (kind === "bell") {
    return <Bell className={iconClass} aria-hidden />;
  }
  return <Bookmark className={iconClass} aria-hidden />;
}

/** Shared layout for mobile menu rows; active route uses same glass as desktop sidebar (`glassActiveNav`). */
const menuItemBaseClass =
  "flex w-full cursor-pointer flex-row items-center justify-start gap-2 py-3 pr-4 pl-4 text-right font-peyda text-base font-medium leading-5 tracking-[0.3px] text-[#424242]";

const menuItemInactiveClass =
  "rounded-[19px] outline-none transition-colors hover:bg-zinc-50/80";

const menuItemActiveClass = cx(
  "relative z-0 rounded-[19px] outline-none transition-[color,background-color]",
  glassActiveNav,
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
);

export function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { canCreatePost } = useCurrentUser();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const openLogoutConfirm = () => setShowLogoutConfirm(true);
  const closeLogoutConfirm = () => setShowLogoutConfirm(false);

  if (pathname?.startsWith("/profile/posts/add") || pathname?.startsWith("/profile/posts/edit")) {
    return null;
  }

  const navItems = PROFILE_NAV_ITEMS.filter((item) => item.href !== "/profile/posts" || canCreatePost);
  const activeItem = getActiveProfileNavItem(pathname, navItems);

  return (
    <>
      <aside className="hidden w-full max-w-[281px] shrink-0 lg:block lg:w-[281px]">
        <nav
          dir="rtl"
          className="flex flex-row items-start justify-start gap-[10px] rounded-[24px] bg-white py-6 px-5 shadow-[0_0_14.7px_rgba(0,0,0,0.04)]"
          aria-label="منوی حساب کاربری"
        >
          <div className="flex w-full max-w-[241px] flex-col justify-between gap-[101px] self-stretch lg:min-h-[334px]">
            <div className="flex w-full max-w-[241px] flex-col gap-[23px]">
              {navItems.map(({ href, label, icon, match }) => {
                const active = isProfileNavActive(pathname, href, match);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cx(
                      "flex w-full flex-row items-center justify-start gap-1 rounded-[19px] py-[10px] px-[10px] transition-[color,background-color]",
                      active
                        ? cx(
                            "relative z-0",
                            glassActiveNav,
                            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
                          )
                        : "hover:bg-zinc-50/80",
                    )}
                  >
                    <span className="relative z-10 inline-flex shrink-0">
                      <NavIcon kind={icon} />
                    </span>
                    <span className={cx("relative z-10 min-w-0", labelClass)}>{label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="w-full max-w-[241px]">
              <button
                type="button"
                onClick={openLogoutConfirm}
                className="flex w-full cursor-pointer flex-row items-center justify-start gap-1 py-[10px] px-[10px] text-right transition-colors hover:bg-zinc-50/80"
              >
                <span className="inline-flex shrink-0">
                  <LogOut className="size-6 shrink-0 stroke-[1.2] text-[#94A3B8]" aria-hidden />
                </span>
                <span className={labelClass}>خروج</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <div className="w-full min-w-0 max-w-full lg:hidden">
        <Menu as="div" className="relative w-full min-w-0 max-w-full">
          {({ open }) => (
            <>
              <MenuButton
                type="button"
                dir="rtl"
                aria-label={`${activeItem.label} — انتخاب بخش حساب کاربری`}
                className={cx(
                  "flex h-12 w-full cursor-pointer flex-row items-center justify-start gap-2 rounded-full border-0 bg-white py-0 pr-4 pl-3 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] outline-none transition-[box-shadow]",
                  "hover:shadow-[0_0_18px_rgba(0,0,0,0.06)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
                  open && "shadow-[0_0_18px_rgba(0,0,0,0.06)]",
                )}
              >
                <span className="inline-flex shrink-0">
                  <NavIcon kind={activeItem.icon} />
                </span>
                <span className={cx("min-w-0 flex-1 truncate text-right", labelClass)}>{activeItem.label}</span>
                <ChevronDown
                  className={cx(
                    "size-5 shrink-0 text-zinc-600 opacity-80 motion-safe:transition-transform motion-safe:duration-200",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </MenuButton>

              <MenuItems
                transition
                anchor={{ to: "bottom", gap: "8px" }}
                modal={false}
                className={cx(
                  "z-[1350] mt-2 min-w-0 origin-top rounded-2xl bg-white px-2 py-2 shadow-[0_0_14.7px_rgba(0,0,0,0.08)] ring-1 ring-zinc-100 outline-none transition focus:outline-none",
                  "w-[var(--button-width,100%)] max-w-[calc(100vw-2.5rem)]",
                  "data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-150 data-[enter]:ease-out data-[leave]:duration-100 data-[leave]:ease-in",
                )}
              >
                {navItems.map((item) => {
                  const navActive = isProfileNavActive(pathname, item.href, item.match);
                  return (
                    <MenuItem key={item.href}>
                      {({ focus }) => (
                        <button
                          type="button"
                          className={cx(
                            menuItemBaseClass,
                            navActive ? menuItemActiveClass : menuItemInactiveClass,
                            !navActive && focus && "bg-zinc-50",
                          )}
                          onClick={() => {
                            router.push(item.href);
                          }}
                        >
                          <span className={cx("inline-flex shrink-0", navActive && "relative z-10")}>
                            <NavIcon kind={item.icon} />
                          </span>
                          <span className={cx("min-w-0 flex-1 text-right", navActive && "relative z-10")}>
                            {item.label}
                          </span>
                        </button>
                      )}
                    </MenuItem>
                  );
                })}

                <MenuSeparator className="my-1 h-px bg-zinc-100" />

                <MenuItem>
                  {({ focus }) => (
                    <button
                      type="button"
                      className={cx(
                        menuItemBaseClass,
                        menuItemInactiveClass,
                        "text-zinc-700",
                        focus && "bg-zinc-50",
                      )}
                      onClick={() => {
                        openLogoutConfirm();
                      }}
                    >
                      <span className="inline-flex shrink-0">
                        <LogOut className="size-6 shrink-0 stroke-[1.2] text-[#94A3B8]" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 text-right">خروج</span>
                    </button>
                  )}
                </MenuItem>
              </MenuItems>
            </>
          )}
        </Menu>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="خروج از حساب کاربری"
        description="آیا از خروج از حساب کاربری خود مطمئن هستید؟"
        confirmText="بله، خارج شو"
        cancelText="انصراف"
        onConfirm={performLogout}
        onCancel={closeLogoutConfirm}
      />
    </>
  );
}
