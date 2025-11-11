"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiClient } from "@/services";
import Invoice from "@/components/invoice";

type StrapiOrderResponse = {
  id: string;
  attributes: any; // raw from Strapi, will be transformed
};

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
         &populate[4]=user.user_info
         &populate[5]=delivery_address.shipping_city.shipping_province
         &populate[6]=shipping
         &populate[7]=contract.contract_transactions.payment_gateway`,
        );

        const raw: StrapiOrderResponse = (res as any).data;

        // --- normalize items (your existing logic) ---
        const transformedItems = raw.attributes.order_items.data.map((item: any) => {
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
        });

        // --- derive payment gateway like in edit page ---
        const txList =
          raw.attributes?.contract?.data?.attributes?.contract_transactions?.data || [];
        const lastTx = txList[txList.length - 1]?.attributes;
        const paymentGateway = lastTx?.payment_gateway?.data?.attributes?.Title || undefined;

        // --- optional: derive a readable full address (city/province) if you want to show it ---
        const addr = raw.attributes?.delivery_address?.data?.attributes;
        const city = addr?.shipping_city?.data?.attributes?.Title;
        const province =
          addr?.shipping_city?.data?.attributes?.shipping_province?.data?.attributes?.Title;
        const fullAddress = [addr?.FullAddress, city, province].filter(Boolean).join(" - ");

        // --- keep shipping relation as-is; just ensure it's present in attrs ---
        const transformedOrder = {
          ...raw,
          attributes: {
            ...raw.attributes,
            order_items: { data: transformedItems },
            paymentGateway, // <- new normalized field
            delivery_address: raw.attributes.delivery_address
              ? {
                  data: {
                    attributes: {
                      ...addr,
                      FullAddress: fullAddress || addr?.FullAddress,
                    },
                  },
                }
              : raw.attributes.delivery_address,
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

  return <Invoice order={order} isPreInvoice={isPreInvoice} />;
}
