"use client";
import Logo from "@/components/Kits/Logo";
import superAdminSidebar from "@/constants/superAdminSidebar";
import Link from "next/link";
import ChevronDownIcon from "../Icons/ChevronDownIcon";
import React, { useState, Fragment, useEffect } from "react";
import clsx from "clsx";
import ExitIcon from "../Icons/ExitIcon";
import SettingsIcon from "../Icons/SettingsIcon";
import { useRouter, usePathname } from "next/navigation";

interface SuperAdminLayoutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperAdminLayoutSidebar({
  isOpen,
  onClose,
}: SuperAdminLayoutSidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const pathname = usePathname();

  // Auto-open the section that matches current path
  useEffect(() => {
    const next: Record<string, boolean> = {};
    const curr = pathname.replace(/\/$/, "");
    superAdminSidebar.forEach((it) => {
      const base = (it.href ?? "").replace(/\/$/, "");
      if (
        it.children.length > 0 &&
        base &&
        (curr === base || curr.startsWith(base + "/"))
      ) {
        next[it.label] = true;
      }
    });
    setOpenMenus((p) => ({ ...p, ...next }));
  }, [pathname]);

  const openAndNavigate = (item: (typeof superAdminSidebar)[number]) => {
    if (item.href) router.push(item.href);
    if (item.children.length > 0) {
      setOpenMenus((p) => ({ ...p, [item.label]: true }));
    }
  };

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 bg-black bg-opacity-50 transition-opacity lg:hidden",
          isOpen ? "opacity-100 z-40" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <div
        id="sidebar"
        className={clsx(
          "fixed lg:static top-0 right-0 h-full z-50 lg:z-auto",
          "w-[280px] lg:w-auto",
          "transform transition-transform duration-300 ease-in-out lg:transform-none",
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          "bg-white p-3 rounded-tl-xl rounded-bl-xl flex flex-col gap-4"
        )}
      >
        <button
          className="lg:hidden absolute top-4 left-4 p-2 hover:bg-neutral-100 rounded-full"
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
            {superAdminSidebar.map((item) => {
              const hasChildren = item.children.length > 0;
              const isOpenMenu = !!openMenus[item.label];

              return (
                <div key={item.label} className="flex flex-col">
                  {/* Parent row */}
                  <div
                    role="button"
                    tabIndex={0}
                    className={clsx(
                      "flex items-center justify-between cursor-pointer py-1.5 px-2",
                      hasChildren && "mb-2"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      openAndNavigate(item);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openAndNavigate(item);
                      }
                    }}
                  >
                    {hasChildren ? (
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="text-neutral-600 text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="text-neutral-600 text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                      </Link>
                    )}

                    {hasChildren && (
                      <div
                        className={clsx(
                          "transition-transform duration-200",
                          isOpenMenu && "rotate-180"
                        )}
                      >
                        <ChevronDownIcon />
                      </div>
                    )}
                  </div>

                  {/* Submenu */}
                  {hasChildren && isOpenMenu && (
                    <div className="mt-2 rounded-xl border border-neutral-100 bg-neutral-50/80 overflow-hidden">
                      {item.children.map((child, index) => (
                        <Fragment key={child.href ?? child.label ?? index}>
                          <Link
                            href={child.href}
                            onClick={(e) => e.stopPropagation()}
                            className="block px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                          >
                            {child.label}
                          </Link>
                          {index !== item.children.length - 1 && (
                            <div className="mx-4 h-px bg-neutral-100" />
                          )}
                        </Fragment>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full h-[1px] bg-neutral-100" />

          <div className="flex items-center cursor-pointer py-1.5 px-2">
            <Link
              href={"/super-admin/settings"}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <SettingsIcon />
                <span className="text-neutral-600 text-sm font-medium">
                  تنظیمات سایت
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center cursor-pointer py-1.5 px-2">
            <Link
              href={"/super-admin/logout"}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <ExitIcon />
                <span className="text-neutral-600 text-sm font-medium">
                  خروج
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
