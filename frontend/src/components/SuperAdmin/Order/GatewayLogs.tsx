"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";

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

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(
          `/order-logs?filters[order][id][$eq]=${orderId}&sort[0]=createdAt:asc` as any,
          {
            headers: {
              Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
          },
        );
        setLogs(((res as any).data || []) as OrderLog[]);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchLogs();
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-base text-foreground-primary">رویدادهای درگاه</span>
      </div>
      {loading && <div className="text-sm text-slate-500">در حال بارگذاری...</div>}
      {!loading && logs.length === 0 && (
        <div className="text-sm text-slate-500">رویدادی ثبت نشده است</div>
      )}
      <div className="flex flex-col gap-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start justify-between rounded-lg border border-slate-100 p-3"
          >
            <div className="flex-1 pr-2">
              <div className="text-sm text-foreground-primary">
                {log.attributes.Description || "ثبت رویداد"}
              </div>
              {log.attributes.Changes && (
                <pre className="text-xs mt-1 whitespace-pre-wrap break-all text-slate-500">
                  {JSON.stringify(log.attributes.Changes, null, 2)}
                </pre>
              )}
            </div>
            <div className="text-xs text-slate-500">
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
    </div>
  );
}
