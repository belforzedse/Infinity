"use client";

import { useEffect, useState, useMemo } from "react";
import { getAdminEvents, getOrderEvents, type EventLog, type EventType, type Severity } from "@/services/event-log";
import ChevronDownIcon from "@/components/Product/Icons/ChevronDownIcon";

interface EventLogViewerProps {
  orderId?: number;
  resourceType?: string;
  resourceId?: string | number;
  filters?: {
    eventType?: EventType;
    severity?: Severity;
    startDate?: string;
    endDate?: string;
  };
  showFilters?: boolean;
  defaultAudience?: "user" | "admin" | "superadmin";
}

const formatDateTime = (value: string) => {
  try {
    const date = new Date(value);
    return new Date(value).toLocaleString("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "—";
  }
};

const getSeverityColor = (severity: Severity): string => {
  switch (severity) {
    case "success":
      return "bg-green-100 text-green-700 border-green-200";
    case "warning":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "error":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
};

const getEventTypeLabel = (type: EventType): string => {
  const labels: Record<EventType, string> = {
    Order: "سفارش",
    Payment: "پرداخت",
    User: "کاربر",
    Product: "محصول",
    Cart: "سبد خرید",
    Wallet: "کیف پول",
    Shipping: "ارسال",
    Admin: "ادمین",
    System: "سیستم",
  };
  return labels[type] || type;
};

export default function EventLogViewer({
  orderId,
  resourceType,
  resourceId,
  filters = {},
  showFilters = false,
  defaultAudience = "admin",
}: EventLogViewerProps) {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const pageSize = 20;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let response;

      if (orderId) {
        // Fetch order-specific events
        response = await getOrderEvents(
          orderId,
          { audience: defaultAudience },
          { page, pageSize, sort: "createdAt:desc" }
        );
      } else {
        // Fetch admin events with filters
        response = await getAdminEvents(
          {
            ...filters,
            resourceType: resourceType,
            resourceId: resourceId,
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
          { page, pageSize, sort: "createdAt:desc" }
        );
      }

      setEvents(response.data || []);
      setPageCount(response.meta.pagination.pageCount);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (orderId || resourceType)) {
      fetchEvents();
    }
  }, [isOpen, orderId, resourceType, resourceId, page, filters.startDate, filters.endDate, filters.eventType, filters.severity, defaultAudience]);

  const filteredEvents = useMemo(() => {
    let result = events;

    if (filters.eventType) {
      result = result.filter((e) => e.EventType === filters.eventType);
    }

    if (filters.severity) {
      result = result.filter((e) => e.Severity === filters.severity);
    }

    return result;
  }, [events, filters.eventType, filters.severity]);

  if (!orderId && !resourceType) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base text-foreground-primary">رویدادها</span>
          <span className="text-xs text-slate-500">
            {events.length ? `${events.length} رویداد ثبت شده` : "رویدادی ثبت نشده است"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1 rounded-full border border-pink-100 px-3 py-1 text-xs font-medium text-pink-600 transition-colors hover:bg-pink-50"
        >
          {isOpen ? "بستن" : "مشاهده جزئیات"}
          <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
            <ChevronDownIcon className="h-3 w-3" />
          </span>
        </button>
      </div>
      {isOpen && (
        <>
          {loading && <div className="text-sm text-slate-500">در حال بارگذاری...</div>}
          {!loading && filteredEvents.length === 0 && (
            <div className="text-sm text-slate-500">رویدادی ثبت نشده است</div>
          )}
          {!loading && filteredEvents.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityColor(event.Severity)}`}
                        >
                          {getEventTypeLabel(event.EventType)}
                        </span>
                        <span className="text-xs text-slate-400">{event.EventCategory}</span>
                      </div>
                      <div className="text-sm font-medium text-foreground-primary">
                        {event.Message}
                      </div>
                      {event.MessageEn && (
                        <div className="mt-1 text-xs text-slate-400">{event.MessageEn}</div>
                      )}
                      {event.ResourceId && (
                        <div className="mt-1 text-xs text-slate-500">
                          {event.ResourceType} #{event.ResourceId}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 text-left">
                      {formatDateTime(event.createdAt)}
                    </div>
                  </div>
                  {event.performed_by && (
                    <div className="text-xs text-slate-400">
                      توسط: {event.performed_by.username || event.performed_by.email || "سیستم"}
                    </div>
                  )}
                </div>
              ))}

              {pageCount > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs disabled:opacity-50"
                  >
                    قبلی
                  </button>
                  <span className="text-xs text-slate-500">
                    صفحه {page} از {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs disabled:opacity-50"
                  >
                    بعدی
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
