"use client";

import { useState, useEffect } from "react";
import { getOrderEvents, type EventLog } from "@/services/event-log";
import { OrderTimelineEvent } from "@/components/User/Orders/Detail/OrderTimeline";

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

interface SuperAdminOrderLogsProps {
  orderId?: string | number;
  audience?: "admin" | "superadmin" | "all";
  pageSize?: number;
  hideHeader?: boolean;
  onEventsChange?: (events: OrderTimelineEvent[]) => void;
}

export default function SuperAdminOrderLogs({
  orderId,
  audience = "admin",
  pageSize = 50,
  hideHeader,
  onEventsChange,
}: SuperAdminOrderLogsProps) {
  const [events, setEvents] = useState<OrderTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!orderId) {
        setEvents([]);
        setLoading(false);
        onEventsChange?.([]);
        return;
      }

      try {
        setLoading(true);
        const response = await getOrderEvents(orderId, { audience }, { sort: "createdAt:asc", pageSize });
        const timelineEvents = (response.data || []).map((event: EventLog) => ({
          id: event.id,
          message: event.Message || event.EventType,
          createdAt: event.createdAt,
          severity: event.Severity,
        }));
        setEvents(timelineEvents);
        onEventsChange?.(timelineEvents);
      } catch (error) {
        console.error("Error fetching super admin order logs:", error);
        setEvents([]);
        onEventsChange?.([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [audience, orderId, onEventsChange, pageSize]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {!hideHeader && <h2 className="mb-4 text-base font-semibold text-foreground-primary">رویدادهای سفارش</h2>}
      {loading ? (
        <div className="text-sm text-slate-500">در حال بارگذاری...</div>
      ) : events.length === 0 ? (
        <div className="text-sm text-slate-500">رویدادی ثبت نشده است</div>
      ) : (
        <ol className="relative space-y-4 border-r border-slate-200 pr-4">
          {events.map((event) => (
            <li key={`${event.id}-${event.createdAt}`} className="relative">
              <span
                className={`absolute -right-[31px] mt-1 h-4 w-4 rounded-full border-2 border-white shadow ring-2 ring-slate-100 ${getSeverityColor(event.severity)}`}
              />
              <div className="flex flex-col gap-1 text-right">
                <span className="text-sm font-medium text-foreground-primary">{event.message}</span>
                <span className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}





