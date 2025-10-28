"use client";

import Link from "next/link";
import { USER_SIDEBAR_ITEMS } from "@/components/User/Constnats";
import { isValidElement, cloneElement } from "react";
import type { ReactElement } from "react";

const enhanceIcon = (icon: ReactElement) =>
  cloneElement(icon, {
    className: "h-5 w-5 shrink-0 text-pink-500",
  });

export default function AccountQuickLinks() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:hidden">
      {USER_SIDEBAR_ITEMS.map((item) => {
        const icon =
          isValidElement(item.icon) && item.icon
            ? enhanceIcon(item.icon as ReactElement)
            : item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm transition-colors hover:border-pink-200 hover:shadow-md"
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-500">{item.text}</span>

            </div>
            {icon}
          </Link>
        );
      })}
    </div>
  );
}

