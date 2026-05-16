"use client";

import Link from "next/link";
import type { AppNotification, NotificationKind } from "@/services/notification.service";
import { InfinityMarkCircle } from "@/components/InfinityMarkCircle";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const KIND_LABELS: Record<NotificationKind, string> = {
  site_message: "پیام سایت",
  comment_reply: "پاسخ داد به کامنت شما",
  comment_approved: "دیدگاه شما تایید شد",
  comment_liked: "پسندیدن دیدگاه شما",
};

function Initials({ name }: { name: string }) {
  const letter = name.trim().charAt(0) || "؟";
  return (
    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#3D4C6E] font-peyda text-base font-semibold text-white">
      {letter}
    </span>
  );
}

function Avatar({ notification }: { notification: AppNotification }) {
  if (notification.kind === "site_message") {
    return <InfinityMarkCircle circleSize={42} markSize={28} className="shrink-0" />;
  }
  return <Initials name={notification.actorName || "؟"} />;
}

type Props = {
  notification: AppNotification;
  onRead: (id: number) => void;
};

export function NotificationItem({ notification, onRead }: Props) {
  const kindLabel = KIND_LABELS[notification.kind] ?? notification.kind;

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id);
  };

  return (
    <Link
      href={notification.link || "/"}
      onClick={handleClick}
      className={cx(
        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50",
        !notification.isRead && "bg-blue-50/60",
      )}
      dir="rtl"
    >
      {/* Text block — right side in RTL */}
      <div className="min-w-0 flex-1 space-y-0.5 text-right">
        <p className="font-peyda text-[11px] leading-5 text-[#94A3B8]">{kindLabel}</p>
        <p className="font-peyda text-sm font-medium leading-5 text-[#424242]">
          {notification.actorName && notification.kind !== "site_message" ? (
            <span className="font-semibold">{notification.actorName} </span>
          ) : null}
          {notification.body}
        </p>
      </div>

      {/* Avatar — left side in RTL */}
      <div className="relative shrink-0">
        <Avatar notification={notification} />
        {!notification.isRead && (
          <span className="absolute -left-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-infinity-primary ring-2 ring-white" />
        )}
      </div>
    </Link>
  );
}
