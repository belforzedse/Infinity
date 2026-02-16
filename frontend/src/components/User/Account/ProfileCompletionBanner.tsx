"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import { isProfileIncomplete } from "@/utils/profile";

const DISMISS_KEY = "profileCompletionBannerDismissed";

export default function ProfileCompletionBanner() {
  const { userData, isLoading } = useUser();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  if (isLoading || !userData || dismissed) return null;
  if (userData.isAdmin || !isProfileIncomplete(userData)) return null;

  return (
    <div
      className="relative flex w-full items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 py-4 pr-4 pl-4"
      role="status"
      aria-live="polite"
    >
      <div className="absolute right-0 top-0 h-full w-1 rounded-l-lg bg-amber-500" />

      <div className="flex flex-1 flex-col items-start gap-0.5 text-right">
        <span className="text-sm font-medium text-foreground-primary">
          اطلاعات پروفایل شما ناقص است. لطفا نام و نام خانوادگی خود را تکمیل کنید.
        </span>
        <span className="text-xs text-neutral-500">پیام سیستم</span>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <Link
          href="/account"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          تکمیل اطلاعات
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded p-1 text-amber-700 hover:bg-amber-100"
          aria-label="بستن"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
    </div>
  );
}
