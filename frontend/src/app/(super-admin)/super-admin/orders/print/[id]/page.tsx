"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services";
import { STRAPI_TOKEN, API_BASE_URL } from "@/constants/api";
import { useParams } from "next/navigation";

type OrderResponse = {
  id: string;
  attributes: {
    createdAt: string;
    Date: string;
    Status: string;
    ShippingCost: number;
    Description?: string;
    user: {
      data: {
        id: string;
        attributes: {
          Phone: string;
          user_info: { data?: { attributes?: { FirstName?: string; LastName?: string } } };
        };
      };
    };
    contract: { data?: { attributes?: { Amount?: number } } };
    order_items: {
      data: Array<{
        id: string;
        attributes: {
          Count: number;
          PerAmount: number;
          ProductTitle: string;
          ProductSKU: string;
          product_variation: {
            data?: {
              attributes?: {
                product?: {
                  data?: {
                    attributes?: {
                      CoverImage?: {
                        data?: { attributes?: { formats?: { thumbnail?: { url?: string } } } };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      }>;
    };
    delivery_address?: {
      data?: {
        attributes?: {
          FullAddress?: string;
          PostalCode?: string;
        };
      };
    };
  };
};

export default function PrintOrderPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          `/orders/${id}?populate[0]=user&populate[1]=contract&populate[2]=order_items&populate[3]=order_items.product_variation.product.CoverImage&populate[4]=user.user_info&populate[5]=delivery_address`,
          { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } },
        );
        setOrder((res as any).data as OrderResponse);
        setTimeout(() => window.print(), 300);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading || !order) return <div className="p-6">در حال بارگذاری…</div>;

  const attrs = order.attributes;
  const subtotal = Number(attrs?.contract?.data?.attributes?.Amount || 0);
  const shipping = Number(attrs.ShippingCost || 0);
  const total = subtotal + shipping;
  const userInfo = attrs.user?.data?.attributes;
  const fullName = `${userInfo?.user_info?.data?.attributes?.FirstName || ""} ${userInfo?.user_info?.data?.attributes?.LastName || ""}`.trim();

  return (
    <div dir="rtl" className="min-h-screen bg-white p-8 print:p-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="mx-auto max-w-4xl rounded-xl border border-neutral-200 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">فاکتور سفارش #{order.id}</h1>
            <p className="text-sm text-neutral-500">{new Date(attrs.Date).toLocaleString("fa-IR")}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">{fullName || "کاربر"}</p>
            <p className="text-sm text-neutral-600">{userInfo?.Phone}</p>
            {attrs?.delivery_address?.data?.attributes?.FullAddress ? (
              <p className="text-xs text-neutral-500 mt-1">
                {attrs.delivery_address.data.attributes.FullAddress}
              </p>
            ) : null}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-100">
              <th className="p-2 text-right">کالا</th>
              <th className="p-2 text-right">کد</th>
              <th className="p-2 text-center">تعداد</th>
              <th className="p-2 text-left">قیمت واحد</th>
              <th className="p-2 text-left">قیمت کل</th>
            </tr>
          </thead>
          <tbody>
            {attrs.order_items.data.map((it) => {
              const a = it.attributes;
              const image =
                API_BASE_URL.split("/api")[0] +
                (a.product_variation.data?.attributes?.product?.data?.attributes?.CoverImage?.data?.attributes?.formats?.thumbnail?.url || "");
              const total = Number(a.PerAmount) * Number(a.Count);
              return (
                <tr key={it.id} className="border-b">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : null}
                      <span>{a.ProductTitle}</span>
                    </div>
                  </td>
                  <td className="p-2">{a.ProductSKU}</td>
                  <td className="p-2 text-center">{a.Count}</td>
                  <td className="p-2 text-left">{Number(a.PerAmount).toLocaleString("fa-IR")} تومان</td>
                  <td className="p-2 text-left">{total.toLocaleString("fa-IR")} تومان</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">جمع جزء</span>
              <span>{subtotal.toLocaleString("fa-IR")} تومان</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">هزینه ارسال</span>
              <span>{shipping.toLocaleString("fa-IR")} تومان</span>
            </div>
            <div className="mt-2 border-t pt-2 text-lg font-bold">
              <div className="flex items-center justify-between">
                <span>مبلغ کل</span>
                <span>{total.toLocaleString("fa-IR")} تومان</span>
              </div>
            </div>
          </div>
        </div>

        {attrs?.Description ? (
          <div className="mt-6 text-sm text-neutral-600">
            <span className="font-medium">یادداشت:</span> {attrs.Description}
          </div>
        ) : null}

        <div className="no-print mt-6 flex justify-end">
          <button
            onClick={() => window.print()}
            className="rounded bg-pink-600 px-4 py-2 text-white"
          >
            پرینت
          </button>
        </div>
      </div>
    </div>
  );
}

