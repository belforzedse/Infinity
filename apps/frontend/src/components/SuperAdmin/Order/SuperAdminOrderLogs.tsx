"use client";

import { useState, useEffect } from "react";
import {
  getOrderAdminActivities,
  type AdminActivity,
  type AdminActivityChange,
} from "@/services/admin-activity";
import type { OrderTimelineEvent } from "@/components/User/Orders/Detail/OrderTimeline";
import { translateOrderStatus } from "@/utils/statusTranslations";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    const dateText = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
    const timeText = new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    return `${timeText} - ${dateText}`;
  } catch {
    return "—";
  }
};

const getSeverityColor = (severity?: "info" | "success" | "warning" | "error"): string => {
  switch (severity) {
    case "success":
      return "bg-green-500";
    case "warning":
      return "bg-yellow-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-slate-400";
  }
};

const ROLE_LABELS_FA: Record<string, string> = {
  Superadmin: "مدیر کل",
  "Store manager": "مدیر فروشگاه",
  Editor: "ویرایشگر",
};

const translateRole = (role?: string): string => (role ? ROLE_LABELS_FA[role] || role : "");

// Persian labels for the field keys that appear in `Changes`. Falls back to the raw key.
const FIELD_LABELS_FA: Record<string, string> = {
  Status: "وضعیت",
  Note: "یادداشت مشتری",
  Description: "توضیحات",
  ShippingCost: "هزینه ارسال",
  ShippingBarcode: "بارکد ارسال",
  ContractAmount: "مبلغ قرارداد",
  ItemsRemoved: "حذف اقلام",
};

const translateFieldLabel = (key: string): string => {
  if (FIELD_LABELS_FA[key]) return FIELD_LABELS_FA[key];
  // Item_<id>_Count → تعداد قلم
  if (/^Item_\d+_Count$/.test(key)) return "تعداد قلم";
  return key;
};

// Render a single before/after value. Status values are translated to Persian.
const renderValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "Status") return translateOrderStatus(String(value));
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const formatChanges = (changes?: Record<string, AdminActivityChange> | null) => {
  if (!changes) return [] as { key: string; label: string; from: string; to: string }[];
  return Object.entries(changes).map(([key, change]) => ({
    key,
    label: translateFieldLabel(key),
    from: renderValue(key, change?.from),
    to: renderValue(key, change?.to),
  }));
};

interface SuperAdminOrderLogsProps {
  orderId?: string | number;
  pageSize?: number;
  hideHeader?: boolean;
  onEventsChange?: (events: OrderTimelineEvent[]) => void;
}

export default function SuperAdminOrderLogs({
  orderId,
  pageSize = 50,
  hideHeader,
  onEventsChange,
}: SuperAdminOrderLogsProps) {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchActivities = async () => {
      if (!orderId) {
        setActivities([]);
        setLoading(false);
        setError(false);
        onEventsChange?.([]);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        const response = await getOrderAdminActivities(orderId, { pageSize });
        if (cancelled) return;
        const list = response.data || [];
        setActivities(list);
        onEventsChange?.(
          list.map((activity) => ({
            id: activity.id,
            message: activity.Title || activity.Message || activity.Action,
            createdAt: activity.createdAt,
            severity: activity.Severity,
          })),
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching super admin order activities:", err);
        setActivities([]);
        setError(true);
        onEventsChange?.([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchActivities();
    return () => {
      cancelled = true;
    };
  }, [orderId, onEventsChange, pageSize]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {!hideHeader && (
        <h2 className="text-foreground-primary mb-4 text-base font-semibold">رویدادهای سفارش</h2>
      )}
      {loading ? (
        <div className="text-sm text-slate-500">در حال بارگذاری...</div>
      ) : error ? (
        <div className="text-sm text-red-500">خطا در دریافت رویدادها</div>
      ) : activities.length === 0 ? (
        <div className="text-sm text-slate-500">رویدادی ثبت نشده است</div>
      ) : (
        <ol className="relative space-y-4 border-r border-slate-200 pr-4">
          {activities.map((activity) => {
            const changes = formatChanges(activity.Changes);
            const actorName = activity.PerformedByName || activity.performed_by?.username;
            const roleLabel = translateRole(activity.PerformedByRole);
            return (
              <li key={`${activity.id}-${activity.createdAt}`} className="relative">
                <span
                  className={`absolute -right-[31px] mt-1 h-4 w-4 rounded-full border-2 border-white shadow ring-2 ring-slate-100 ${getSeverityColor(
                    activity.Severity,
                  )}`}
                />
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-foreground-primary text-sm font-medium">
                    {activity.Title || activity.Message || "ثبت رویداد"}
                  </span>

                  {(actorName || roleLabel) && (
                    <span className="text-xs text-slate-600">
                      توسط {actorName || "ادمین"}
                      {roleLabel ? ` (${roleLabel})` : ""}
                    </span>
                  )}

                  {changes.length > 0 && (
                    <ul className="mt-1 flex flex-col gap-1">
                      {changes.map((change) => (
                        <li
                          key={change.key}
                          className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600"
                        >
                          <span className="font-medium text-slate-700">{change.label}:</span>{" "}
                          <span className="text-slate-400">از</span>{" "}
                          <span className="text-slate-500">{change.from}</span>{" "}
                          <span className="text-slate-400">به</span>{" "}
                          <span className="text-slate-700">{change.to}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <span className="text-xs text-slate-500">{formatDateTime(activity.createdAt)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
