"use client";

import { Bell } from "lucide-react";

type Props = {
  unreadCount: number;
};

export function NotificationBell({ unreadCount }: Props) {
  return (
    <>
      <Bell size={20} strokeWidth={1.5} aria-hidden />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-infinity-primary px-1 font-peyda text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </>
  );
}
