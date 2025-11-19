"use client";
import Logo from "@/components/Kits/Logo";
import superAdminSidebar, { getSidebarItemsForRole } from "@/constants/superAdminSidebar";
import Link from "next/link";
import ChevronDownIcon from "../Icons/ChevronDownIcon";
import React, { useState, Fragment, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import ExitIcon from "../Icons/ExitIcon";
import SettingsIcon from "../Icons/SettingsIcon";
import { usePathname, useRouter } from "next/navigation";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";
import { performLogout } from "@/utils/logout";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface SuperAdminLayoutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperAdminLayoutSidebar({ isOpen, onClose }: SuperAdminLayoutSidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const { roleName } = useCurrentUser();
  const normalizedRole = (roleName ?? "").toLowerCase();
  const isStoreManager = normalizedRole === "store manager";
  const sidebarItems = useMemo(() => getSidebarItemsForRole(roleName), [roleName]);

  const handleLogout = () => {
    performLogout();
  };

  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);

  // Auto-open the section that matches current path
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

  const openAndNavigate = (item: (typeof superAdminSidebar)[number]) => {
    if (item.href) router.push(item.href);
    if (item.children.length > 0) {
      setOpenMenus((p) => ({ ...p, [item.id]: true }));
    }
  };

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 bg-black bg-opacity-50 transition-opacity lg:hidden",
          isOpen ? "z-40 opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <div
        id="sidebar"
        className={clsx(
          "fixed right-0 top-0 z-50 h-full lg:static lg:z-auto",
          "w-[280px] lg:w-auto",
          "transform transition-transform duration-300 ease-in-out lg:transform-none",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          "flex flex-col gap-4 rounded-bl-xl rounded-tl-xl bg-white p-3",
        )}
      >
        <button
          className="absolute left-4 top-4 rounded-full p-2 hover:bg-neutral-100 lg:hidden"
          onClick={onClose}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
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

        <div className="flex items-center justify-center">
          <Logo />
        </div>

        <div className="flex flex-col gap-3">
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
                    className={clsx(
                      "relative mb-2 flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-150",
                      "hover:bg-neutral-50",
                      isActive ? "bg-pink-50 text-pink-600" : "text-neutral-600",
                    )}
                  >
                    {isActive && (
                      <span className="pointer-events-none absolute -right-1.5 top-1/2 h-10 w-2 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-pink-600 to-pink-400" />
                    )}
                    <div className="flex w-full items-center gap-2">
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
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
                      "cursor-default transition-colors duration-150",
                    )}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openAndNavigate(item);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span
                        className={clsx(
                          "text-sm font-medium",
                          isActive ? "text-pink-600" : "text-neutral-600",
                        )}
                      >
                        {item.label}
                      </span>
                    </div>

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
                  </div>

                  {/* Submenu with expand/collapse animation */}
                  <AnimatePresence initial={false}>
                    {hasChildren && isOpenMenu && (
                      <motion.div
                        key={`${item.id}-submenu`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="mt-2 overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50"
                        id={`submenu-${item.id}`}
                      >
                        {item.children.map((child, index) => {
                          const curr = pathname.replace(/\/$/, "");
                          const href = (child.href ?? "").replace(/\/$/, "");
                          const active = !!href && (curr === href || curr.startsWith(href + "/"));
                          return (
                            <Fragment key={child.id}>
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15, delay: index * 0.03 }}
                              >
                        <Link
                          href={child.href}
                          onClick={(e) => e.stopPropagation()}
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
                            <span className="absolute -right-1.5 top-1/2 h-8 w-2 -translate-y-1/2 rounded-r-full bg-pink-500" />
                          )}
                        </Link>
                              </motion.div>
                              {index !== item.children.length - 1 && (
                                <div className="mx-4 h-px bg-neutral-100" />
                              )}
                            </Fragment>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="h-[1px] w-full bg-neutral-100" />

          {!isStoreManager && (
            <div className="flex cursor-pointer items-center px-2 py-1.5">
              <Link href={"/super-admin/settings"} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <SettingsIcon />
                  <span className="text-sm font-medium text-neutral-600">تنظیمات سایت</span>
                </div>
              </Link>
            </div>
          )}

          <div className="flex cursor-pointer items-center px-2 py-1.5">
            <button type="button" onClick={openConfirm} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <ExitIcon />
                <span className="text-sm font-medium text-neutral-600">خروج</span>
              </div>
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
        </div>
      </div>
    </>
  );
}
