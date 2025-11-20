"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ChevronDownIcon from "@/components/Product/Icons/ChevronDownIcon";
import { getOrderEvents, type EventLog } from "@/services/event-log";

type OrderLog = {
  id: number;
  attributes: {
    createdAt: string;
    Description?: string;
    Changes?: any;
  };
};

export default function GatewayLogs({ orderId }: { orderId: number }) {
  const [auditLogs, setAuditLogs] = useState<OrderLog[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "audit">("events");
  const { isStoreManager } = useCurrentUser();

  useEffect(() => {
    const fetchLogs = async () => {
      if (!orderId) return;

      try {
        setLoading(true);

        // Fetch audit logs (technical)
        const auditRes = await apiClient.get(
          `/order-logs?filters[order][id][$eq]=${orderId}&sort[0]=createdAt:asc` as any,
        );
        setAuditLogs(((auditRes as any).data || []) as OrderLog[]);

        // Fetch event logs (human-readable)
        const eventRes = await getOrderEvents(
          orderId,
          { audience: "admin" },
          { sort: "createdAt:asc", pageSize: 50 }
        );
        setEventLogs(eventRes.data || []);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && orderId) {
      fetchLogs();
    }
  }, [orderId, isOpen]);

  if (!orderId || isStoreManager) return null;

  const formatDateTime = (value: string) => {
    try {
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

  const getSeverityColor = (severity: "info" | "success" | "warning" | "error"): string => {
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

  const totalLogs = eventLogs.length + auditLogs.length;

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base text-foreground-primary">رویدادهای درگاه</span>
          <span className="text-xs text-slate-500">
            {totalLogs ? `${totalLogs} رویداد ثبت شده` : "رویدادی ثبت نشده است"}
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
          {!loading && totalLogs === 0 && (
            <div className="text-sm text-slate-500">رویدادی ثبت نشده است</div>
          )}
          {!loading && totalLogs > 0 && (
            <div className="mt-2">
              <div className="mb-2 flex gap-2 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("events")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "events"
                      ? "border-b-2 border-pink-500 text-pink-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  رویدادهای خوانا ({eventLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("audit")}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "audit"
                      ? "border-b-2 border-pink-500 text-pink-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  لاگ‌های فنی ({auditLogs.length})
                </button>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {activeTab === "events" ? (
                  <>
                    {eventLogs.length === 0 ? (
                      <div className="text-sm text-slate-500">رویداد خوانایی ثبت نشده است</div>
                    ) : (
                      eventLogs.map((event) => (
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
                                  {event.EventType}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-foreground-primary">
                                {event.Message}
                              </div>
                              {event.MessageEn && (
                                <div className="mt-1 text-xs text-slate-400">{event.MessageEn}</div>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 text-left">
                              {formatDateTime(event.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {auditLogs.length === 0 ? (
                      <div className="text-sm text-slate-500">لاگ فنی ثبت نشده است</div>
                    ) : (
                      auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 md:flex-row md:items-start md:justify-between"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-foreground-primary">
                              {log.attributes.Description || "ثبت رویداد"}
                            </div>
                            {log.attributes.Changes && (
                              <pre className="mt-1 whitespace-pre-wrap break-all text-xs text-slate-500">
                                {JSON.stringify(log.attributes.Changes, null, 2)}
                              </pre>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 md:text-left">
                            {formatDateTime(log.attributes.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
