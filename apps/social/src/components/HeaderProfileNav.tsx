"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { buildPersianProfileGreeting } from "@/utils/persian-profile-greeting";

const profilePillClass =
  "relative isolate inline-flex h-[40px] w-auto min-w-0 flex-row items-center justify-end gap-1 overflow-hidden rounded-[20px] border-0 box-border " +
  "bg-transparent pr-3 pl-[18px] font-medium text-xs leading-[21px] text-[#94A3B8] shadow-none " +
  "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[20px] before:content-[''] " +
  "before:bg-[linear-gradient(179.66deg,rgba(255,255,255,0.54)_26.71%,rgba(217,226,255,0.54)_105.94%)] " +
  "before:opacity-100 before:transition-opacity before:duration-300 before:ease-out " +
  "after:pointer-events-none after:absolute after:inset-0 after:z-0 after:rounded-[20px] after:content-[''] " +
  "after:bg-[linear-gradient(22.48deg,rgba(255,255,255,0.54)_-104.7%,rgba(217,226,255,0.54)_88.1%)] " +
  "after:opacity-0 after:transition-opacity after:duration-300 after:ease-out " +
  "hover:before:opacity-0 hover:after:opacity-100 motion-reduce:hover:before:opacity-100 motion-reduce:hover:after:opacity-0 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70";

/**
 * Desktop header profile control: `/profile` when session is valid, otherwise `/auth`.
 */
export function HeaderProfileNav() {
  const { isAuthenticated, firstName } = useCurrentUser();
  const href = isAuthenticated ? "/profile" : "/auth";

  const label = isAuthenticated
    ? buildPersianProfileGreeting(firstName ?? "") || "پروفایل"
    : "ورود";

  const ariaLabel = isAuthenticated
    ? label === "پروفایل"
      ? "پروفایل کاربر"
      : label
    : "ورود به حساب";

  return (
    <Link href={href} className={profilePillClass} aria-label={ariaLabel}>
      <span
        dir="ltr"
        className="relative z-10 inline-flex min-w-0 flex-row items-center justify-end gap-1"
      >
        <span dir="rtl" className="max-w-[160px] min-w-0 truncate">
          {label}
        </span>
        <span className="inline-flex shrink-0 items-center justify-center [&>svg]:block">
          <User size={20} strokeWidth={1.2} className="text-[#94A3B8]" aria-hidden />
        </span>
      </span>
    </Link>
  );
}
