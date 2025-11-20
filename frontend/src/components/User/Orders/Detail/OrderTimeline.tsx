"use client";

import { useEffect, useState } from "react";
import type { Order, OrderLog } from "@/services/order";
import { translateOrderStatus } from "@/utils/statusTranslations";
import { getOrderEvents, type EventLog } from "@/services/event-log";

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

interface OrderTimelineProps {
  order: Order;
}

interface TimelineEvent {
  id: number;
  message: string;
  createdAt: string;
  severity?: "info" | "success" | "warning" | "error";
}

// Map event severity to color
const getSeverityColor = (severity?: "info" | "success" | "warning" | "error"): string => {
  switch (severity) {
    case "success":
      return "bg-green-500";
    case "warning":
      return "bg-yellow-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-pink-500";
  }
};

export default function OrderTimeline({ order }: OrderTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Fetch event logs for this order (user-facing only)
        const response = await getOrderEvents(order.id, { audience: "user" }, { sort: "createdAt:asc" });

        if (response.data && response.data.length > 0) {
          // Use event logs
          const timelineEvents: TimelineEvent[] = response.data.map((event: EventLog) => ({
            id: event.id,
            message: event.Message,
            createdAt: event.createdAt,
            severity: event.Severity,
          }));
          setEvents(timelineEvents);
        } else {
          // Fallback to audit logs if no events exist
          const logs = [...(order.orderLogs ?? [])].sort((a, b) => {
            const aDate = new Date(a.createdAt ?? order.createdAt).getTime();
            const bDate = new Date(b.createdAt ?? order.createdAt).getTime();
            return aDate - bDate;
          });

          if (logs.length > 0) {
            const timelineEvents: TimelineEvent[] = logs.map((log) => ({
              id: log.id,
              message: log.Description || `سفارش ${log.Action === "Create" ? "ایجاد شد" : "بروزرسانی شد"}`,
              createdAt: log.createdAt || order.createdAt,
              severity: "info" as const,
            }));
            setEvents(timelineEvents);
          } else {
            // Final fallback: default events
            setEvents([
              {
                id: -1,
                message: "سفارش ثبت شد",
                createdAt: order.createdAt,
                severity: "success" as const,
              },
              {
                id: -2,
                message: `وضعیت فعلی: ${translateOrderStatus(order.Status)}`,
                createdAt: order.updatedAt,
                severity: "info" as const,
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching order events:", error);
        // Fallback to default events on error
        setEvents([
          {
            id: -1,
            message: "سفارش ثبت شد",
            createdAt: order.createdAt,
            severity: "success" as const,
          },
          {
            id: -2,
            message: `وضعیت فعلی: ${translateOrderStatus(order.Status)}`,
            createdAt: order.updatedAt,
            severity: "info" as const,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (order.id) {
      fetchEvents();
    }
  }, [order.id, order.orderLogs, order.createdAt, order.updatedAt, order.Status]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground-primary">وضعیت سفارش</h2>
        <div className="text-sm text-slate-500">در حال بارگذاری...</div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-foreground-primary">وضعیت سفارش</h2>
      {events.length === 0 ? (
        <div className="text-sm text-slate-500">رویدادی ثبت نشده است</div>
      ) : (
        <ol className="relative space-y-4 border-r border-slate-200 pr-4">
          {events.map((event) => (
            <li key={`${event.id}-${event.createdAt}`} className="relative">
              <span
                className={`absolute -right-[31px] mt-1 h-4 w-4 rounded-full border-2 border-white shadow ring-2 ring-pink-100 ${getSeverityColor(event.severity)}`}
              />
              <div className="flex flex-col gap-1 text-right">
                <span className="text-sm font-medium text-foreground-primary">
                  {event.message}
                </span>
                <span className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

