"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import Invoice from "@/components/invoice";

type StrapiOrderResponse = {
  id: string;
  attributes: any; // raw from Strapi, will be transformed
};

export default function PrintOrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hasPrinted = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          `/orders/${id}?populate[0]=user
          &populate[1]=contract
          &populate[2]=order_items
          &populate[3]=order_items.product_variation.product.CoverImage
          &populate[4]=user.user_info
          &populate[5]=delivery_address
          &populate[6]=shipping
         &populate[7]=PaymentGateway`, // ✅ correct
          { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } },
        );

        const raw: StrapiOrderResponse = (res as any).data;

        // transform order_items to expected format
        const transformedItems = raw.attributes.order_items.data.map(
          (item: any) => {
            const attr = item.attributes || {};
            const pv = attr.product_variation?.data?.attributes || {};
            const product = pv.product?.data?.attributes || {};

            return {
              id: item.id,
              attributes: {
                Count: attr.Quantity ?? attr.Count ?? 1,
                PerAmount: attr.UnitPrice ?? attr.PerAmount ?? 0,
                ProductSKU: pv.SKU ?? "—",
                ProductTitle: product.Name ?? attr.ProductTitle ?? "—",
              },
            };
          },
        );

        const transformedOrder = {
          ...raw,
          attributes: {
            ...raw.attributes,
            order_items: {
              data: transformedItems,
            },
          },
        };

        setOrder(transformedOrder);
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

  return <Invoice order={order} />;
}
