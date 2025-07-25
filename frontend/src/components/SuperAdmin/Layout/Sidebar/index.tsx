"use client";
import Logo from "@/components/Kits/Logo";
import superAdminSidebar from "@/constants/superAdminSidebar";
import Link from "next/link";
import ChevronDownIcon from "../Icons/ChevronDownIcon";
import { useState } from "react";
import clsx from "clsx";
import ExitIcon from "../Icons/ExitIcon";

interface SuperAdminLayoutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuperAdminLayoutSidebar({
  isOpen,
  onClose,
}: SuperAdminLayoutSidebarProps) {
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          "fixed inset-0 bg-black bg-opacity-50 transition-opacity lg:hidden",
          isOpen ? "opacity-100 z-40" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
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
        {/* Close button for mobile */}
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
            {superAdminSidebar.map((item) => (
              <div key={item.label} className="flex flex-col">
                <div
                  className={clsx(
                    "flex items-center justify-between cursor-pointer py-1.5 px-2",
                    item.children.length > 0 && "mb-2"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.children.length > 0 && toggleMenu(item.label);
                  }}
                >
                  {item.children.length > 0 ? (
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

                  {item.children.length > 0 && (
                    <div
                      className={clsx(
                        "transition-transform duration-200",
                        openMenus[item.label] && "rotate-180"
                      )}
                    >
                      <ChevronDownIcon />
                    </div>
                  )}
                </div>

                {item.children.length > 0 && openMenus[item.label] && (
                  <div className="flex flex-col gap-2 pr-5 py-2">
                    {item.children.map((child, index) => (
                      <>
                        <Link
                          key={child.href}
                          href={child.href}
                          className="text-neutral-600 text-xs hover:text-pink-500 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {child.label}
                        </Link>

                        {index !== item.children.length - 1 && (
                          <div className="w-full h-[1px] bg-slate-100"></div>
                        )}
                      </>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="w-full h-[1px] bg-neutral-100"></div>

          {/* <div className="flex items-center cursor-pointer py-1.5 px-2">
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
          </div> */}

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
