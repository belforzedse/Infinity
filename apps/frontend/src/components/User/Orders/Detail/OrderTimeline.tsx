"use client";

import { useCallback, useEffect, useState } from "react";
import type { Order } from "@/services/order";
import { translateOrderStatus } from "@/utils/statusTranslations";
import { getUserActivities, type UserActivity } from "@/services/user-activity";

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
  hideHeader?: boolean;
  onEventsChange?: (events: TimelineEvent[]) => void;
}

interface TimelineEvent {
  id: number;
  message: string;
  createdAt: string;
  severity?: "info" | "success" | "warning" | "error";
}

export type OrderTimelineEvent = TimelineEvent;

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

export default function OrderTimeline({ order, hideHeader, onEventsChange }: OrderTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const handleEventsChange = useCallback(
    (nextEvents: TimelineEvent[]) => {
      setEvents(nextEvents);
      onEventsChange?.(nextEvents);
    },
    [onEventsChange],
  );

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Fetch user activities for this order - only milestone events
        // Milestone activity types: order_placed, order_payment_success, order_payment_failed, order_shipped, order_delivered, order_cancelled
        const milestoneTypes = [
          "order_placed",
          "order_payment_success",
          "order_payment_failed",
          "order_shipped",
          "order_delivered",
          "order_cancelled",
        ];

        // Get user activities for the order owner
        const orderUserId =
          order.user?.id ||
          (order.user as any)?.data?.id ||
          (order as any).user ||
          null;
        if (!orderUserId) {
          handleEventsChange([]);
          setLoading(false);
          return;
        }

        const response = await getUserActivities(Number(orderUserId), {
          page: 1,
          pageSize: 50,
        });

        // Filter to only order-related milestone activities for this specific order
        const orderActivities = (response.data || []).filter(
          (activity: UserActivity) =>
            activity.ResourceType === "order" &&
            activity.ResourceId === String(order.id) &&
            milestoneTypes.includes(activity.ActivityType)
        );

        if (orderActivities.length > 0) {
          // Sort by creation date ascending
          orderActivities.sort((a, b) => {
            const aDate = new Date(a.createdAt).getTime();
            const bDate = new Date(b.createdAt).getTime();
            return aDate - bDate;
          });

          const timelineEvents: TimelineEvent[] = orderActivities.map((activity: UserActivity) => ({
            id: activity.id,
            message: activity.Title || activity.Message || "رویداد سفارش",
            createdAt: activity.createdAt,
            severity: activity.Severity || "info",
          }));
          handleEventsChange(timelineEvents);
        } else {
          // Fallback: show basic order status
          handleEventsChange([
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
      } catch (error) {
        console.error("Error fetching order user activities:", error);
        // Fallback to default events on error
        handleEventsChange([
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
  }, [order.id, order.user, order.createdAt, order.updatedAt, order.Status, handleEventsChange]);

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
      {!hideHeader && (
        <h2 className="mb-4 text-base font-semibold text-foreground-primary">وضعیت سفارش</h2>
      )}
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

