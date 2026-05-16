"use client";

import Link from "next/link";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationBell } from "./NotificationBell";
import { NotificationItem } from "./NotificationItem";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type Variant = "mobile" | "desktop";

type Props = {
  variant: Variant;
};

const BUTTON_CLASS: Record<Variant, string> = {
  mobile:
    "relative rounded-2xl bg-white p-2.5 text-[#94A3B8] shadow-sm transition-colors hover:text-zinc-700",
  desktop:
    "relative rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-zinc-100 hover:text-zinc-800",
};

export function NotificationDropdown({ variant }: Props) {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, refresh } =
    useNotifications();

  return (
    <Popover>
      <PopoverButton
        type="button"
        className={BUTTON_CLASS[variant]}
        aria-label="اعلان‌ها"
        onClick={() => refresh()}
      >
        <NotificationBell unreadCount={unreadCount} />
      </PopoverButton>

      <PopoverPanel
        transition
        anchor={{ to: "bottom start", gap: 12 }}
        className={cx(
          "z-1350 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white",
          "shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-zinc-100",
          "origin-top transition",
          "data-closed:scale-95 data-closed:opacity-0",
          "data-enter:duration-150 data-enter:ease-out",
          "data-leave:duration-100 data-leave:ease-in",
          "lg:w-[400px]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3" dir="rtl">
          <h3 className="font-peyda text-base font-semibold text-[#424242]">اعلان‌ها</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="font-peyda text-xs font-medium text-[#3D4C6E] transition-colors hover:text-infinity-primary focus:outline-none"
            >
              خواندن همه
            </button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[420px] overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="flex flex-col divide-y divide-zinc-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3" dir="rtl">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
                    <div className="h-4 w-48 animate-pulse rounded bg-zinc-100" />
                  </div>
                  <div className="h-[42px] w-[42px] shrink-0 animate-pulse rounded-full bg-zinc-100" />
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center" dir="rtl">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
                <Bell size={24} strokeWidth={1.5} className="text-zinc-400" aria-hidden />
              </div>
              <p className="font-peyda text-sm font-medium text-[#424242]">اعلانی ندارید</p>
              <p className="mt-1 font-peyda text-xs text-[#94A3B8]">
                اعلان‌های جدید اینجا نمایش داده می‌شوند
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-zinc-100 px-4 py-2">
            <Link
              href="/profile/notifications"
              className="block w-full py-1 text-center font-peyda text-xs font-medium text-[#94A3B8] transition-colors hover:text-[#3D4C6E]"
            >
              مشاهده همه اعلان‌ها
            </Link>
          </div>
        )}
      </PopoverPanel>
    </Popover>
  );
}
