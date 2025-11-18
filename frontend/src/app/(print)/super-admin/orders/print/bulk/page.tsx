"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/services";
import Invoice from "@/components/invoice";
import { normalizeOrderForInvoice } from "../normalizeOrder";

export default function BulkPrintPage() {
  const params = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const hasPrinted = useRef(false);

  useEffect(() => {
    const idsParam = params.get("ids")?.split(",").filter(Boolean) ?? [];

    if (!idsParam.length) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const results = await Promise.all(
          idsParam.map(async (id) => {
            const res = await apiClient.get(
              `/orders/${id}?populate[0]=user
                 &populate[1]=contract
                 &populate[2]=order_items
                 &populate[3]=order_items.product_variation.product.CoverImage
                 &populate[4]=user.user_info
                 &populate[5]=delivery_address.shipping_city.shipping_province
                 &populate[6]=shipping
                 &populate[7]=contract.contract_transactions.payment_gateway`,
            );
            return normalizeOrderForInvoice((res as any).data, id);
          }),
        );
        setOrders(results.filter(Boolean) as any[]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [params]);

  useEffect(() => {
    if (orders.length && !hasPrinted.current) {
      hasPrinted.current = true;
      // allow time for layout to paint all pages
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [orders]);

  if (loading) return <div className="p-6">در حال بارگذاری سفارش‌ها…</div>;
  if (!orders.length) return <div className="p-6">سفارشی انتخاب نشده است.</div>;

  return (
    <div className="print:bg-white print:p-0">
      {orders.map((order) => (
        <div
          key={order.id}
          className="break-after-page print:break-after-page"
          style={{ breakAfter: "page" }}
        >
          <Invoice order={order as any} />
        </div>
      ))}
    </div>
  );
}
