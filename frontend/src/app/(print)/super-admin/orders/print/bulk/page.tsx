"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import Invoice from "@/components/invoice";

type StrapiOrder = {
  id: string;
  attributes: any;
};

function transformOrder(raw: StrapiOrder) {
  // --- normalize items to what <Invoice/> expects ---
  const items = (raw.attributes?.order_items?.data || []).map((item: any) => {
    const attr = item.attributes || {};
    const pv = attr.product_variation?.data?.attributes || {};
    const product = pv.product?.data?.attributes || {};
    return {
      id: item.id,
      attributes: {
        Count: attr.Quantity ?? attr.Count ?? 1,
        PerAmount: attr.UnitPrice ?? attr.PerAmount ?? 0,
        ProductSKU: pv.SKU ?? attr.ProductSKU ?? "—",
        ProductTitle: product.Name ?? attr.ProductTitle ?? "—",
      },
    };
  });

  // --- derive latest payment gateway title like your edit page ---
  const txList = raw.attributes?.contract?.data?.attributes?.contract_transactions?.data || [];
  const lastTx = txList[txList.length - 1]?.attributes;
  const paymentGateway = lastTx?.payment_gateway?.data?.attributes?.Title || undefined;

  // --- optionally compose address with city/province like edit page ---
  const addr = raw.attributes?.delivery_address?.data?.attributes;
  const city = addr?.shipping_city?.data?.attributes?.Title;
  const province =
    addr?.shipping_city?.data?.attributes?.shipping_province?.data?.attributes?.Title;
  const composedAddress = [addr?.FullAddress, city, province].filter(Boolean).join(" - ");

  return {
    ...raw,
    attributes: {
      ...raw.attributes,
      paymentGateway, // <— used by Invoice
      order_items: { data: items },
      // keep delivery_address shape but prefer composed address if available
      delivery_address: raw.attributes.delivery_address
        ? {
            data: {
              attributes: {
                ...addr,
                FullAddress: composedAddress || addr?.FullAddress,
              },
            },
          }
        : raw.attributes.delivery_address,
    },
  };
}

export default function BulkPrintPage() {
  const params = useSearchParams();
  const [orders, setOrders] = useState<StrapiOrder[]>([]);
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
          idsParam.map((id) =>
            apiClient
              .get(
                `/orders/${id}?populate[0]=user
                 &populate[1]=contract
                 &populate[2]=order_items
                 &populate[3]=order_items.product_variation.product.CoverImage
                 &populate[4]=user.user_info
                 &populate[5]=delivery_address.shipping_city.shipping_province
                 &populate[6]=shipping
                 &populate[7]=contract.contract_transactions.payment_gateway`,
                { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } },
              )
              .then((res) => transformOrder((res as any).data as StrapiOrder)),
          ),
        );
        setOrders(results);
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
