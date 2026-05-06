"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiClient } from "@/services";
import Invoice from "@/components/invoice";
import { normalizeOrderForInvoice } from "../normalizeOrder";

export default function PrintOrderPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hasPrinted = useRef(false);
  const isPreInvoice = searchParams.get('type') === 'pre-invoice';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Handle temp pre-invoice case
        if (id === 'temp-preview') {
          const tempOrderData = sessionStorage.getItem('tempPreInvoiceOrder');
          if (tempOrderData) {
            const tempOrder = JSON.parse(tempOrderData);
            setOrder(tempOrder);
            return;
          } else {
            throw new Error('No temp order data found');
          }
        }

        const res = await apiClient.get(
          `/orders/${id}?populate[0]=user
         &populate[1]=contract
         &populate[2]=order_items
         &populate[3]=order_items.product_variation.product.CoverImage
         &populate[4]=order_items.product_variation.Price
         &populate[5]=order_items.product_variation.DiscountPrice
         &populate[6]=order_items.product_color
         &populate[7]=order_items.product_size
         &populate[8]=order_items.product_variation_model
         &populate[9]=user.user_info
         &populate[10]=delivery_address.shipping_city.shipping_province
         &populate[11]=shipping
         &populate[12]=contract.contract_transactions.payment_gateway`,
        );

        const normalizedOrder = normalizeOrderForInvoice((res as any).data, id as string);
        if (!normalizedOrder) {
          throw new Error("سفارش پیدا نشد");
        }
        setOrder(normalizedOrder);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (order && !hasPrinted.current) {
      hasPrinted.current = true;
      const timeout = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timeout);
    }
  }, [order]);

  useEffect(() => {
    const afterPrint = () => {
      hasPrinted.current = false; // optional if you want to allow reprint on revisit
    };

    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  if (loading || !order) return <div className="p-6">در حال بارگذاری…</div>;

  return <Invoice order={order} isPreInvoice={isPreInvoice} />;
}
