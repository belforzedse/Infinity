"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import ChevronDownIcon from "@/components/Product/Icons/ChevronDownIcon";

type OrderLog = {
  id: number;
  attributes: {
    createdAt: string;
    Description?: string;
    Changes?: any;
  };
};

export default function GatewayLogs({ orderId }: { orderId: number }) {
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { isStoreManager } = useCurrentUser();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/order-logs?filters[order][id][$eq]=${orderId}&sort[0]=createdAt:asc` as any,
        );
        setLogs(((res as any).data || []) as OrderLog[]);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchLogs();
  }, [orderId]);

  if (!orderId || isStoreManager) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base text-foreground-primary">رویدادهای درگاه</span>
          <span className="text-xs text-slate-500">
            {logs.length ? `${logs.length} رویداد ثبت شده` : "رویدادی ثبت نشده است"}
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
          {!loading && logs.length === 0 && (
            <div className="text-sm text-slate-500">رویدادی ثبت نشده است</div>
          )}
          <div className="mt-2 flex flex-col gap-2">
            {logs.map((log) => (
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
                  {new Date(log.attributes.createdAt).toLocaleString("fa-IR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
