"use client";
import Image from "next/image";
import React from "react";
import Barcode from "react-barcode";
import { translatePaymentGateway } from "@/utils/statusTranslations";
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
  isPreInvoice?: boolean;
};
const nf = new Intl.NumberFormat("fa-IR");

const formatPersianDate = (value?: string) => {
  if (!value) return "نامشخص";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "نامشخص";
  return date.toLocaleDateString("fa-IR");
};

const formatPersianTime = (value?: string) => {
  if (!value) return "نامشخص";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "نامشخص";
  return date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });
};
export default function Invoice({ order, isPreInvoice = false }: Props) {
  const attrs = order.attributes;
  // robust number coercion (handles strings)
  const toNum = (v: unknown) =>
    typeof v === "number" ? v : Number(String(v ?? 0).replace(/[^\d.-]/g, "")); // strip commas etc.

  const shipping = toNum(attrs.ShippingCost);

  // Calculate subtotal from order items (sum of all items)
  const itemsSubtotal = (attrs.order_items?.data ?? []).reduce((sum: number, it: any) => {
    const a = it?.attributes || {};
    return sum + toNum(a.PerAmount) * toNum(a.Count);
  }, 0);

  // Get contract amount (final total - authoritative source, may include shipping)
  const contractAmount = toNum(attrs.contract?.data?.attributes?.Amount);

  // Use contract amount as total if available (it's the authoritative final amount)
  // Otherwise, calculate as itemsSubtotal + shipping
  // This avoids double-counting shipping if contractAmount already includes it
  const total = contractAmount > 0
    ? contractAmount
    : itemsSubtotal + shipping;

  // Subtotal is always the sum of items (for display purposes)
  const subtotal = itemsSubtotal;

  // Get receiver name from local-user-info (user_info relation on plugin user)
  // Try multiple paths to handle different data structures from API/normalization
  const getUserInfo = () => {
    const user = attrs.user;
    if (!user) return undefined;
    
    // Check if user_info is explicitly null (no record exists)
    const userInfoValue = user.data?.attributes?.user_info ?? user.attributes?.user_info;
    if (userInfoValue === null) {
      return null; // Explicitly null means no user_info record exists
    }
    
    // Try standard normalized path: user.data.attributes.user_info.data.attributes
    if (user.data?.attributes?.user_info?.data?.attributes) {
      return user.data.attributes.user_info.data.attributes;
    }
    
    // Try alternative normalized path: user.data.attributes.user_info.attributes
    if (user.data?.attributes?.user_info?.attributes) {
      return user.data.attributes.user_info.attributes;
    }
    
    // Try direct attributes path: user.attributes.user_info.data.attributes
    if (user.attributes?.user_info?.data?.attributes) {
      return user.attributes.user_info.data.attributes;
    }
    
    // Try direct attributes path: user.attributes.user_info.attributes
    if (user.attributes?.user_info?.attributes) {
      return user.attributes.user_info.attributes;
    }
    
    // Try if user_info is directly unwrapped
    if (userInfoValue && typeof userInfoValue === 'object' && !userInfoValue.data && (userInfoValue.FirstName || userInfoValue.LastName)) {
      return userInfoValue;
    }
    
    return undefined;
  };
  
  const userInfo = getUserInfo();
  const fullName =
    userInfo && userInfo !== null && (userInfo.FirstName || userInfo.LastName)
      ? `${userInfo.FirstName ?? ""} ${userInfo.LastName ?? ""}`.trim()
      : "";

  const getDisplayValue = (value: string | null | undefined, fallback = "نامشخص") => {
    if (isPreInvoice) {
      return value || "----";
    }
    return value || fallback;
  };

  return (
    <div dir="rtl" className="min-h-screen w-full bg-white p-8 font-peyda-fanum">
      <div className="mx-auto w-full print:max-w-none">
        {/* Header */}
        <div className="mb-10 grid grid-cols-1 grid-rows-1 border border-black">
          <div className="flex items-start justify-around p-6">
            <div className="text-lg justify-center text-right align-middle leading-6">
              <p className="justify-self-middle justify-center">عنوان: فروشگاه پوشاک اینفینیتی</p>
            </div>
            <Image
              src="/images/logo_PDF.webp"
              alt="Logo"
              width="300"
              height="300"
              sizes="(max-width: 200) 200px, 200px"
            />
            <div className="text-lg mb-2 p-2">
              <p>
                تاریخ چاپ: {new Date().toLocaleDateString("fa-IR")}{" "}
                {new Date().toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p></p>
              <p>شناسه سفارش: {order.id}</p>
            </div>
          </div>
          <div className="bg-slate-gray-100 row-start-2 h-[20px] w-full justify-end justify-self-auto bg-gray-100 px-6 pb-10 pt-4">
            <div>
              <p className="justify-end">
                <span className="font-bold text-gray-700">آدرس فروشگاه:</span>
                گلستان، گرگان، بلوار ناهارخوران، نبش عدالت ۶۸، کد پستی ۴۹۱۶۹۷۳۳۸۱
              </p>
            </div>
          </div>
        </div>

        {/* Store address */}

        <div className="text-lg mb-2 justify-normal border border-black p-6 text-center leading-6">
          <p className="text-lg">
            <span className="font-bold">گیرنده:</span> <span> {getDisplayValue(fullName)} </span>
            <span className="font-bold">شماره تماس:</span>{" "}
            {getDisplayValue(attrs.user?.data?.attributes?.Phone)}
          </p>
          <p>
            <span className="font-bold">تاریخ سفارش:</span>{" "}
            {formatPersianDate(attrs.Date)}
            {" --- "}
            {formatPersianTime(attrs.createdAt)}
          </p>
          {(attrs.delivery_address?.data?.attributes?.FullAddress || isPreInvoice) && (
            <p>
              <span className="font-bold">آدرس ارسال:</span>{" "}
              {getDisplayValue(attrs.delivery_address?.data?.attributes?.FullAddress)}
            </p>
          )}
          {(attrs.delivery_address?.data?.attributes?.PostalCode || isPreInvoice) && (
            <p>
              <span className="font-bold">کد پستی:</span>{" "}
              {getDisplayValue(attrs.delivery_address?.data?.attributes?.PostalCode)}
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
                          {color ? `رنگ: ${color}` : ""} {size ? ` | سایز: ${size}` : ""}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="border p-2 text-center">{nf.format(unit)} تومان</td>

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
        <p className="text-lg mb-2">تعداد کل: {attrs.order_items.data.length}</p>

        {/* Summary Table */}
        <div className="flex w-full justify-around justify-self-stretch">
          <table className="text-lg w-3/4 border border-black">
            <tbody>
              <tr className="border border-black">
                <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">مبلغ کل</td>
                <td className="w-1/2 border p-2 text-center">
                  {nf.format(subtotal)}
                  تومان
                </td>
              </tr>
              <tr className="border border-black">
                <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">هزینه ارسال </td>
                <td className="w-1/2 border p-2 text-center">
                  {nf.format(shipping)}
                  تومان
                </td>
              </tr>
              <tr className="border border-black">
                <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">مبلغ نهایی</td>
                <td className="w-1/2 border p-2 text-center">{nf.format(total)} تومان</td>
              </tr>
            </tbody>
          </table>
          <div className="flex justify-start">
            <div style={{ width: "180px", height: "30px" }}>
              <Barcode
                value={String(order.id)}
                format="CODE128"
                width={2}
                height={30}
                displayValue={false}
                margin={0}
                background="#ffffff"
                lineColor="#000000"
              />
            </div>
          </div>
        </div>

        {/* Footer - Payment method */}
        <div className="text-sm mt-6 font-bold">
          روش پرداخت:{" "}
          {translatePaymentGateway(attrs.paymentGateway || attrs.PaymentMethod || attrs.Description)}
        </div>
      </div>
    </div>
  );
}
