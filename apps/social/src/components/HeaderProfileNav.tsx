"use client";

import Link from "next/link";
import { Plus, User } from "lucide-react";
import { glassDefaultCrossfadeSurface } from "@repo/ui/glass";
import { useCurrentUser } from "@/hooks/use-current-user";
import { buildPersianProfileGreeting } from "@/utils/persian-profile-greeting";

const profilePillClass =
  glassDefaultCrossfadeSurface("before:rounded-[20px]", "after:rounded-[20px]") +
  " inline-flex h-[40px] w-auto min-w-0 flex-row items-center justify-end gap-1 rounded-[20px] box-border " +
  "pr-3 pl-[18px] font-medium text-xs leading-[21px] text-[#94A3B8] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70";

/**
 * Reuses the colors / gradients of the `blue` variant in `components/ui/Button.tsx`
 * but matches the **size** (`h-[40px]`, `rounded-[20px]`, `text-xs`) of the profile
 * pill so the header user slot stays the same footprint across all roles.
 * Classes are duplicated on an anchor instead of nesting a `<button>` inside `<Link>`.
 */
const newPostButtonClass =
  "relative isolate inline-flex h-[40px] w-auto min-w-0 flex-row items-center justify-center gap-1.5 overflow-hidden rounded-[20px] border-0 box-border " +
  "shadow-[0_4px_14px_rgba(57,76,110,0.22)] " +
  "bg-transparent pr-3 pl-[18px] font-medium text-xs leading-[21px] text-white " +
  "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[20px] before:content-[''] " +
  "before:bg-[linear-gradient(180deg,#566D97_0%,#98BDFF_100%)] " +
  "before:opacity-100 before:transition-opacity before:duration-300 before:ease-out " +
  "after:pointer-events-none after:absolute after:inset-0 after:z-0 after:rounded-[20px] after:content-[''] " +
  "after:bg-[linear-gradient(70.36deg,#3E5070_10.29%,#A0C2FF_74.27%)] " +
  "after:opacity-0 after:transition-opacity after:duration-300 after:ease-out " +
  "hover:before:opacity-0 hover:after:opacity-100 motion-reduce:hover:before:opacity-100 motion-reduce:hover:after:opacity-0 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70";

const CREATE_POST_HREF = "/profile/posts/add";

/**
 * Desktop header user slot:
 * - super admin / store manager → blue **پست جدید** CTA → `/profile/posts/new`
 * - authenticated customer → greeting pill → `/profile`
 * - guest → `ورود` pill → `/auth`
 */
export function HeaderProfileNav() {
  const { isAuthenticated, firstName, canCreatePost } = useCurrentUser();

  if (canCreatePost) {
    return (
      <Link
        href={CREATE_POST_HREF}
        className={newPostButtonClass}
        aria-label="ایجاد پست جدید"
      >
        <span
          dir="ltr"
          className="relative z-10 inline-flex min-w-0 flex-row items-center justify-center gap-1.5"
        >
          <span dir="rtl" className="min-w-0">
            پست جدید
          </span>
          <span className="inline-flex shrink-0 items-center justify-center [&>svg]:block [&>svg]:stroke-[1.5]">
            <Plus size={18} aria-hidden />
          </span>
        </span>
      </Link>
    );
  }

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
