"use client";
import Image from "next/image";
import React from "react";
type Props = {
  order: {
    shipping?: {
      data?: {
        attributes?: {
          Name?: string;
        };
      };
    };

    id: string;
    attributes: {
      paymentGateway?: string; // <- normalized from print page
      Date: string;
      createdAt: string;
      Description?: string;
      ShippingCost?: number;
      PaymentMethod?: string;
      shipping?: {
        data?: {
          attributes?: {
            Name?: string;
          };
        };
      };
      user: {
        data: {
          attributes: {
            Phone: string;
            user_info: {
              data?: {
                attributes?: {
                  FirstName?: string;
                  LastName?: string;
                };
              };
            };
          };
        };
      };
      delivery_address?: {
        data?: {
          attributes?: {
            FullAddress?: string;
            PostalCode?: string;
          };
        };
      };
      contract: {
        data?: {
          attributes?: {
            Amount?: number;
          };
        };
      };
      order_items: {
        data: Array<{
          id: string;
          attributes: {
            Count: number;
            PerAmount: number;
            ProductTitle: string;
            ProductSKU: string;
            product_color?: {
              data?: {
                attributes?: {
                  Title?: string;
                };
              };
            };
            product_size?: {
              data?: {
                attributes?: {
                  Title?: string;
                };
              };
            };
          };
        }>;
      };
    };
  };
};
const nf = new Intl.NumberFormat("fa-IR");
export default function Invoice({ order }: Props) {
  const attrs = order.attributes;
  // robust number coercion (handles strings)
  const toNum = (v: unknown) =>
    typeof v === "number" ? v : Number(String(v ?? 0).replace(/[^\d.-]/g, "")); // strip commas etc.

  const shipping = toNum(attrs.ShippingCost);
  const subtotal = toNum(attrs.contract?.data?.attributes?.Amount);
  const total = subtotal + shipping;

  // (optional) also compute from line items to detect mismatches
  const itemsTotal = (attrs.order_items?.data ?? []).reduce(
    (sum: number, it: any) => {
      const a = it?.attributes || {};
      return sum + toNum(a.PerAmount) * toNum(a.Count);
    },
    0,
  );
  // if you want to display/compare:
  // const mathMismatch = Math.abs(itemsTotal - subtotal) > 1;

  const fullName =
    `${attrs.user?.data?.attributes?.user_info?.data?.attributes?.FirstName ?? ""} ${attrs.user?.data?.attributes?.user_info?.data?.attributes?.LastName ?? ""}`.trim();

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-white p-8 font-peyda-fanum"
    >
      <div className="mx-auto w-full print:max-w-none">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between border border-black p-2">
          <Image
            src="/images/full-logo.png"
            alt="Logo"
            width="120"
            height="120"
            sizes="(max-width: 80) 76px, 104px"
          />
          <div className="text-lg text-right leading-6">
            <p>عنوان: فروشگاه پوشاک اینفینیتی</p>
            <p>تاریخ چاپ: {new Date().toLocaleDateString("fa-IR")}</p>
            <p>
              {new Date().toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>شناسه سفارش: {order.id}</p>
          </div>
          <div className="text-lg mb-2 p-2">
            <p>
              <span>آدرس فروشگاه:</span>
              گلستان، گرگان،<br></br> بلوار ناهارخوران، نبش عدالت ۶۸،<br></br>{" "}
              کد پستی ۴۹۱۶۹۷۳۳۸۱
            </p>
          </div>
        </div>

        {/* Store address */}

        <div className="text-lg mb-2 border border-black p-2 leading-6">
          <p className="text-lg">
            <span className="font-bold">گیرنده:</span> {fullName || "نامشخص"}
          </p>
          <p>
            <span className="font-bold">شماره تماس:</span>{" "}
            {attrs.user.data.attributes.Phone}
          </p>
          <p>
            <span className="font-bold">تاریخ سفارش:</span>{" "}
            {new Date(attrs.Date).toLocaleDateString("fa-IR")}
          </p>
          {attrs.delivery_address?.data?.attributes?.FullAddress && (
            <p>
              <span className="font-bold">آدرس ارسال:</span>{" "}
              {attrs.delivery_address.data.attributes.FullAddress}
            </p>
          )}
          {attrs.delivery_address?.data?.attributes?.PostalCode && (
            <p>
              <span className="font-bold">کد پستی:</span>{" "}
              {attrs.delivery_address.data.attributes.PostalCode}
            </p>
          )}

          {attrs.shipping?.data?.attributes?.Name && (
            <p>
              <span className="font-bold">روش حمل و نقل:</span>{" "}
              {attrs.shipping.data.attributes.Name}
            </p>
          )}
        </div>

        {/* Product Table */}
        <table className="text-lg mb-2 w-full border">
          <thead className="bg-gray-200">
            <tr className="border">
              <th className="border p-2">ردیف</th>
              <th className="border p-2">شناسه</th>
              <th className="border p-2">محصول</th>
              <th className="border p-2">قیمت</th>
              <th className="border p-2">تعداد</th>
              <th className="border p-2">مبلغ کل</th>
            </tr>
          </thead>
          <tbody>
            {attrs.order_items.data.map((item, index) => {
              const a = item.attributes || {};
              const count = Number(a.Count ?? 0);
              const unit = Number(a.PerAmount ?? 0);
              const itemsTotal = count * unit;

              // If you have these relations populated, they render; otherwise they stay empty.
              const color = a.product_color?.data?.attributes?.Title || "";
              const size = a.product_size?.data?.attributes?.Title || "";

              // Safer formatter

              return (
                <tr key={item.id} className="break-inside-avoid">
                  <td className="border p-2 text-center">{index + 1}</td>

                  <td className="border p-2">{a.ProductSKU || "—"}</td>

                  <td className="border p-2">
                    <div className="flex flex-col">
                      <span>{a.ProductTitle || "—"}</span>
                      {(color || size) && (
                        <span className="text-sm mt-1 text-neutral-600">
                          {color ? `رنگ: ${color}` : ""}{" "}
                          {size ? ` | سایز: ${size}` : ""}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="border p-2 text-center">
                    {nf.format(unit)} تومان
                  </td>

                  <td className="border p-2 text-center">{nf.format(count)}</td>

                  <td className="border p-2 text-center font-bold">
                    {nf.format(itemsTotal)} تومان
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Row below table */}
        <p className="text-lg mb-2">
          تعداد کل: {attrs.order_items.data.length}
        </p>

        {/* Summary Table */}
        <div className="flex w-full justify-center justify-self-auto">
          <table className="text-lg w-full border border-black">
            <tbody>
              <tr className="border border-black">
                <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">
                  مبلغ کل
                </td>
                <td className="w-1/2 border p-2 text-center">
                  {nf.format(subtotal)}
                  تومان
                </td>
              </tr>
              <tr className="border border-black">
                <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">
                  هزینه ارسال{" "}
                </td>
                <td className="w-1/2 border p-2 text-center">
                  {nf.format(shipping)}
                  تومان
                </td>
              </tr>
              <tr className="border border-black">
                <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">
                  مبلغ نهایی
                </td>
                <td className="w-1/2 border p-2 text-center">
                  {nf.format(total)} تومان
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer - Payment method */}
        <div className="text-sm mt-6 font-bold">
          روش پرداخت:{" "}
          {attrs.paymentGateway ||
            attrs.PaymentMethod ||
            attrs.Description ||
            "نامشخص"}{" "}
        </div>
      </div>
    </div>
  );
}
