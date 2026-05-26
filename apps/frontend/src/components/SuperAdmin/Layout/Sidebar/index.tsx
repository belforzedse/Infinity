"use client";

import { SuperAdminLogo } from "@repo/brand";
import superAdminSidebar, {
  getSidebarItemsForRole,
  type SidebarItem as SuperAdminSidebarItem,
} from "@/constants/superAdminSidebar";
import Link from "next/link";
import ChevronDownIcon from "../Icons/ChevronDownIcon";
import React, { useState, Fragment, useEffect, useMemo } from "react";
import clsx from "clsx";
import ExitIcon from "../Icons/ExitIcon";
import { usePathname, useRouter } from "next/navigation";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";
import { performLogout } from "@/utils/logout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Dialog, Transition } from "@headlessui/react";

interface SuperAdminLayoutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Only true in the mobile ClientLayout; avoids an open Headless Dialog trap on tablet/desktop */
  enableMobileDrawer?: boolean;
}

type SidebarNavProps = {
  sidebarItems: SuperAdminSidebarItem[];
  openMenus: Record<string, boolean>;
  setOpenMenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  variant: "mobile" | "desktop";
};

function activeEdgeClass(variant: "mobile" | "desktop", heightClass: string): string {
  if (variant === "mobile") {
    return `pointer-events-none absolute left-0 top-1/2 ${heightClass} w-2 -translate-y-1/2 rounded-l-full`;
  }
  return `pointer-events-none absolute -right-1.5 top-1/2 ${heightClass} w-2 -translate-y-1/2 rounded-r-full`;
}

function SidebarNav({
  sidebarItems,
  openMenus,
  setOpenMenus,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
  variant,
}: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const showLabels = variant === "mobile" || !isCollapsed;

  const handleLogout = () => {
    performLogout();
  };

  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);

  const openAndNavigate = (item: (typeof superAdminSidebar)[number]) => {
    if (item.href) {
      router.push(item.href);
      onNavigate?.();
    }
    if (item.children.length > 0) {
      setOpenMenus((p) => ({ ...p, [item.id]: true }));
    }
  };

  const handleParentClick = (item: (typeof superAdminSidebar)[number]) => {
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
      if (item.href) {
        const href = item.href;
        setTimeout(() => {
          router.push(href);
          onNavigate?.();
        }, 100);
      } else if (item.children.length > 0) {
        setOpenMenus((p) => ({
          ...p,
          [item.id]: !p[item.id],
        }));
      }
      return;
    }
    openAndNavigate(item);
  };

  const menuItems = (
    <div className="flex flex-col gap-6">
      {sidebarItems.map((item) => {
        const hasChildren = item.children.length > 0;
        const isOpenMenu = !!openMenus[item.id];
        const curr = pathname.replace(/\/$/, "");
        const itemBase = (item.href ?? "").replace(/\/$/, "");
        const hasActiveChild = item.children.some((child) => {
          const childHref = (child.href ?? "").replace(/\/$/, "");
          return childHref && (curr === childHref || curr.startsWith(childHref + "/"));
        });
        const isDashboardItem = item.id === "dashboard";
        const isActiveBase =
          itemBase &&
          (curr === itemBase ||
            curr === `${itemBase}/` ||
            (!isDashboardItem && curr.startsWith(itemBase + "/")));
        const isActive = Boolean(isActiveBase) || hasActiveChild;

        if (!hasChildren) {
          return (
            <Link
              key={item.id}
              href={item.href ? item.href : ""}
              onClick={() => onNavigate?.()}
              className={clsx(
                "relative mb-2 flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-150",
                "hover:bg-neutral-50",
                isActive ? "bg-pink-50 text-pink-600" : "text-neutral-600",
                isCollapsed && variant === "desktop" && "md:justify-center md:px-2",
              )}
              title={isCollapsed && variant === "desktop" ? item.label : undefined}
            >
              {isActive && showLabels && (
                <span
                  className={clsx(
                    activeEdgeClass(variant, "h-10"),
                    "bg-gradient-to-b from-pink-600 to-pink-400",
                  )}
                />
              )}
              <div
                className={clsx(
                  "flex w-full items-center gap-2",
                  isCollapsed && variant === "desktop" && "md:justify-center md:gap-0",
                )}
              >
                {item.icon}
                {showLabels && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          );
        }

        return (
          <div key={item.id} className="flex flex-col">
            <div
              role="button"
              tabIndex={0}
              className={clsx(
                "relative mb-2 flex items-center justify-between rounded-lg px-2 py-1.5",
                "cursor-pointer transition-colors duration-150",
                "hover:bg-neutral-50",
                isActive && showLabels && "bg-pink-50 text-pink-600",
                !isActive && "text-neutral-600",
                isCollapsed && variant === "desktop" && "md:justify-center md:px-2",
              )}
              onClick={() => handleParentClick(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleParentClick(item);
                }
              }}
              title={isCollapsed && variant === "desktop" ? item.label : undefined}
            >
              <div
                className={clsx(
                  "flex items-center gap-2",
                  isCollapsed && variant === "desktop" && "md:justify-center md:gap-0",
                )}
              >
                {item.icon}
                {showLabels && (
                  <span
                    className={clsx(
                      "text-sm font-medium",
                      isActive ? "text-pink-600" : "text-neutral-600",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </div>
              {isActive && showLabels && (
                <span
                  className={clsx(
                    activeEdgeClass(variant, "h-10"),
                    "bg-gradient-to-b from-pink-600 to-pink-400",
                  )}
                />
              )}

              {showLabels && (
                <div
                  role="button"
                  tabIndex={0}
                  className={clsx(
                    "rounded-md p-1 transition-transform duration-200",
                    "transition-colors duration-150 hover:bg-neutral-50",
                    isOpenMenu && "rotate-180",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenus((p) => ({
                      ...p,
                      [item.id]: !p[item.id],
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenMenus((p) => ({
                        ...p,
                        [item.id]: !p[item.id],
                      }));
                    }
                  }}
                  aria-expanded={isOpenMenu}
                  aria-controls={`submenu-${item.id}`}
                >
                  <ChevronDownIcon />
                </div>
              )}
            </div>

            {hasChildren && isOpenMenu && showLabels && (
              <div
                className="mt-2 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50"
                id={`submenu-${item.id}`}
              >
                {item.children.map((child, index) => {
                  const childPath = pathname.replace(/\/$/, "");
                  const href = (child.href ?? "").replace(/\/$/, "");
                  const active = !!href && (childPath === href || childPath.startsWith(href + "/"));
                  return (
                    <Fragment key={child.id}>
                      <Link
                        href={child.href}
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate?.();
                        }}
                        className={clsx(
                          "text-sm block px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500",
                          "transition-colors duration-150",
                          "relative pl-6 pr-2",
                          active
                            ? "bg-neutral-100 font-medium text-neutral-900"
                            : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900",
                        )}
                      >
                        {child.label}
                        {active && (
                          <span
                            className={clsx(activeEdgeClass(variant, "h-8"), "bg-pink-500")}
                          />
                        )}
                      </Link>
                      {index !== item.children.length - 1 && (
                        <div className="mx-4 h-px bg-neutral-100" />
                      )}
                    </Fragment>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const logoutSection = (
    <>
      <div className="h-px w-full shrink-0 bg-neutral-100" />
      <div
        className={clsx(
          "flex shrink-0 cursor-pointer items-center px-2 py-1.5",
          isCollapsed && variant === "desktop" && "md:justify-center md:px-2",
        )}
      >
        <button
          type="button"
          onClick={openConfirm}
          className={clsx(
            "flex items-center gap-2",
            isCollapsed && variant === "desktop" && "md:justify-center md:gap-0",
          )}
          title={isCollapsed && variant === "desktop" ? "خروج" : undefined}
        >
          <ExitIcon />
          {showLabels && <span className="text-sm font-medium text-neutral-600">خروج</span>}
        </button>
        <ConfirmDialog
          isOpen={showConfirm}
          title="خروج از حساب کاربری"
          description="آیا از خروج از حساب کاربری خود مطمئن هستید؟"
          confirmText="بله، خارج شو"
          cancelText="انصراف"
          onConfirm={handleLogout}
          onCancel={closeConfirm}
        />
      </div>
    </>
  );

  if (variant === "mobile") {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{menuItems}</div>
        {logoutSection}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {menuItems}
      {logoutSection}
    </div>
  );
}

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  sidebarItems: SuperAdminSidebarItem[];
  openMenus: Record<string, boolean>;
  setOpenMenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

function SuperAdminMobileSidebarDrawer({
  isOpen,
  onClose,
  sidebarItems,
  openMenus,
  setOpenMenus,
}: MobileDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1200]" onClose={onClose}>
        <div dir="ltr">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]" aria-hidden />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transform transition ease-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel
                dir="rtl"
                className="fixed right-0 top-0 z-50 flex h-dvh w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl"
                style={{
                  paddingBottom: "env(safe-area-inset-bottom)",
                }}
              >
                <header
                  className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3"
                  style={{
                    paddingTop: "max(0.75rem, env(safe-area-inset-top))",
                  }}
                >
                  <SuperAdminLogo compact />
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100"
                    aria-label="بستن منو"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path
                        d="M6 18L18 6M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </header>

                <nav className="flex min-h-0 flex-1 flex-col p-3" aria-label="منوی مدیریت">
                  <SidebarNav
                    sidebarItems={sidebarItems}
                    openMenus={openMenus}
                    setOpenMenus={setOpenMenus}
                    isCollapsed={false}
                    onNavigate={onClose}
                    variant="mobile"
                  />
                </nav>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function SuperAdminLayoutSidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  enableMobileDrawer = false,
}: SuperAdminLayoutSidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const { roleName } = useCurrentUser();
  const sidebarItems = useMemo(() => getSidebarItemsForRole(roleName), [roleName]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    const curr = pathname.replace(/\/$/, "");
    sidebarItems.forEach((it) => {
      const base = (it.href ?? "").replace(/\/$/, "");
      if (it.children.length > 0 && base && (curr === base || curr.startsWith(base + "/"))) {
        next[it.id] = true;
      }
    });
    setOpenMenus((p) => ({ ...p, ...next }));
  }, [pathname, sidebarItems]);

  return (
    <>
      {enableMobileDrawer && (
        <SuperAdminMobileSidebarDrawer
          isOpen={isOpen}
          onClose={onClose}
          sidebarItems={sidebarItems}
          openMenus={openMenus}
          setOpenMenus={setOpenMenus}
        />
      )}

      <div
        id="sidebar"
        className={clsx(
          "relative hidden md:flex md:flex-col",
          "md:static md:z-auto lg:static lg:z-auto",
          "h-full w-full transition-all duration-300 ease-in-out",
          isCollapsed ? "md:w-[80px] lg:w-[80px]" : "md:w-[280px] lg:w-[250px]",
          "rounded-bl-xl rounded-tl-xl bg-white",
        )}
      >
        {onToggleCollapse && (
          <button
            className="absolute left-0 top-4 z-10 flex h-8 items-center justify-center rounded-l-none rounded-r-full border border-neutral-200 bg-white pl-1 pr-2 shadow-sm hover:bg-neutral-50"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={clsx("transition-transform duration-200", isCollapsed ? "" : "rotate-180")}
              aria-hidden
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {!isCollapsed && (
          <div className="flex flex-shrink-0 items-center justify-center p-3 pb-4">
            <SuperAdminLogo />
          </div>
        )}

        {isCollapsed && (
          <div className="flex flex-shrink-0 items-center justify-center border-b border-neutral-100 px-2 py-3">
            <SuperAdminLogo compact />
          </div>
        )}

        <div
          className={clsx(
            "flex min-h-0 flex-1 flex-col gap-3 bg-white p-3 pt-0",
            "md:sticky md:top-0 lg:sticky lg:top-0",
          )}
        >
          <SidebarNav
            sidebarItems={sidebarItems}
            openMenus={openMenus}
            setOpenMenus={setOpenMenus}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            variant="desktop"
          />
        </div>
      </div>
    </>
  );
}
