"use client";

import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSmoothLoading } from "@/hooks/useSmoothLoading";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-2xl bg-white shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3" dir="rtl">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton-shimmer h-3 w-24 rounded" />
            <div className="skeleton-shimmer h-4 w-48 rounded" />
          </div>
          <div className="skeleton-shimmer h-[42px] w-[42px] shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function ProfileNotificationsPage() {
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const showLoading = useSmoothLoading(isLoading, { showDelayMs: 80, minVisibleMs: 240 });

  return (
    <div className="flex w-full flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">اعلان‌ها</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="font-peyda text-sm font-medium text-[#3D4C6E] transition-colors hover:text-infinity-primary focus:outline-none"
          >
            خواندن همه
          </button>
        )}
      </div>

      {isLoading ? (
        showLoading ? <NotificationsSkeleton /> : null
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="اعلانی ندارید"
          description="اعلان‌های مربوط به دیدگاه‌ها و پیام‌های سایت اینجا نمایش داده می‌شوند."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
          <div className="divide-y divide-zinc-100">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
