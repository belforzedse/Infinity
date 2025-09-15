"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import Invoice from "@/components/invoice"; // ← create if not yet

type OrderResponse = {
  id: string;
  attributes: any;
};

export default function BulkPrintPage() {
  const params = useSearchParams();
  const ids = params.get("ids")?.split(",") ?? [];
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const hasPrinted = useRef(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const results = await Promise.all(
          ids.map((id) =>
            apiClient
              .get(
                `/orders/${id}?populate[0]=user&populate[1]=contract&populate[2]=order_items&populate[3]=order_items.product_variation.product.CoverImage&populate[4]=user.user_info&populate[5]=delivery_address
                &populate[6]=PaymentGateway.id
                 &populate[7]=PaymentGateway.title`,
                {
                  headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
                },
              )
              .then((res) => (res as any).data as OrderResponse),
          ),
        );
        setOrders(results);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [ids]);

  useEffect(() => {
    if (orders.length && !hasPrinted.current) {
      hasPrinted.current = true;
      setTimeout(() => window.print(), 1000);
    }
  }, [orders]);

  if (loading) return <div className="p-6">در حال بارگذاری سفارش‌ها…</div>;

  return (
    <div className="print:bg-white print:p-0">
      {orders.map((order) => (
        <div key={order.id} className="break-after-page print:break-after-page">
          <Invoice order={order} />
        </div>
      ))}
    </div>
  );
}
