"use client";
import Image from "next/image";
import React from "react";
import Barcode from "react-barcode";
import { translatePaymentGateway } from "@/utils/statusTranslations";
import { SITE_URL } from "@/config/site";
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
      Note?: string;
      ShippingCost?: number;
      PaymentMethod?: string;
      DiscountCode?: string;
      AppliedDiscountAmount?: number;
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
            OriginalPrice?: number;
            DiscountPrice?: number;
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
            product_variation_model?: {
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
  const discount = toNum(attrs.AppliedDiscountAmount || 0);
  const discountCode = attrs.DiscountCode;

  // Calculate original subtotal (sum of OriginalPrice * Count) and discounted subtotal (sum of PerAmount * Count)
  let originalSubtotal = 0;
  let discountedSubtotal = 0;

  (attrs.order_items?.data ?? []).forEach((it: any) => {
    const a = it?.attributes || {};
    const count = toNum(a.Count);
    const perAmount = toNum(a.PerAmount);
    const originalPrice = a.OriginalPrice ? toNum(a.OriginalPrice) : perAmount;

    originalSubtotal += originalPrice * count;
    discountedSubtotal += perAmount * count;
  });

  // Calculate product discount (difference between original and discounted subtotal)
  const productDiscount = originalSubtotal - discountedSubtotal;
  const hasProductDiscount = productDiscount > 0;

  // Calculate subtotal from order items (sum of all items) - use discounted subtotal
  const itemsSubtotal = discountedSubtotal;

  // Get contract amount (final total - authoritative source, may include shipping)
  const contractAmount = toNum(attrs.contract?.data?.attributes?.Amount);

  // Use contract amount as total if available (it's the authoritative final amount)
  // Otherwise, calculate as itemsSubtotal - discount + shipping
  // This avoids double-counting shipping if contractAmount already includes it
  const total = contractAmount > 0
    ? contractAmount
    : Math.max(0, itemsSubtotal - discount + shipping);

  // Subtotal is always the sum of items (for display purposes) - use discounted subtotal
  const subtotal = itemsSubtotal;

  // Get receiver name from local-user-info (user_info relation on plugin user)
  // Try multiple paths to handle different data structures from API/normalization
  const getUserInfo = () => {
    const user = attrs.user as any; // Cast to any to handle different data structures
    if (!user) return undefined;

    // Check if user_info is explicitly null (no record exists)
    const userInfoValue = (user as any).data?.attributes?.user_info ?? (user as any).attributes?.user_info;
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
    if ((user as any).attributes?.user_info?.data?.attributes) {
      return (user as any).attributes.user_info.data.attributes;
    }

    // Try direct attributes path: user.attributes.user_info.attributes
    if ((user as any).attributes?.user_info?.attributes) {
      return (user as any).attributes.user_info.attributes;
    }

    // Try if user_info is directly unwrapped
    if (userInfoValue && typeof userInfoValue === 'object' && !('data' in userInfoValue)) {
      const unwrapped = userInfoValue as any;
      if (unwrapped.FirstName || unwrapped.LastName) {
        return unwrapped as { FirstName?: string; LastName?: string };
      }
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
    <div dir="rtl" className="min-h-screen w-full bg-white p-4 print:p-2 font-peyda-fanum">
      <div className="mx-auto w-full print:max-w-none">
        {/* Header */}
        <div className="mb-10 grid grid-cols-1 grid-rows-1 border border-black">
          <div className="flex items-start justify-around p-6">
            <div className="justify-center text-right align-middle text-lg leading-6">
              <p className="justify-self-middle justify-center">عنوان: فروشگاه پوشاک اینفینیتی</p>
            </div>
            <Image
              src="/images/logo_PDF.webp"
              alt="Logo"
              width="300"
              height="300"
              sizes="(max-width: 200) 200px, 200px"
            />
            <div className="mb-2 p-2 text-lg">
              <p>
                تاریخ چاپ: {new Date().toLocaleDateString("fa-IR")}{" "}
                {new Date().toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p></p>
              <p>شناسه سفارش: {order.id}</p>
              <div className="mt-2 flex justify-center">
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
          </div>
          <div className="row-start-2 w-full bg-gray-100 px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-right">
              {/* Store Address Column - spans full width */}
              <div className="col-span-2 flex items-center gap-2">
                <span className="font-bold text-gray-700">آدرس فروشگاه:</span>
                <span className="text-gray-800">
                  گلستان، گرگان، بلوار ناهارخوران، نبش عدالت ۶۸، کد پستی ۴۹۱۶۹۷۳۳۸۱
                </span>
              </div>

              {/* Website URL Column */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700">وبسایت:</span>
                <span className="text-gray-800">{SITE_URL}</span>
              </div>

              {/* Phone Number Column */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700">شماره تماس:</span>
                <span className="text-gray-800">017-325-251-44</span>
              </div>
            </div>
          </div>
        </div>

        {/* Store address */}

        <div className="mb-2 border border-black p-6 text-right text-lg leading-6">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              <span className="font-bold">گیرنده:</span> {getDisplayValue(fullName)}
            </span>
            <span className="text-gray-400">|</span>
            <span>
              <span className="font-bold">شماره تماس:</span>{" "}
              {getDisplayValue(attrs.user?.data?.attributes?.Phone)}
            </span>
            <span className="text-gray-400">|</span>
            <span>
              <span className="font-bold">تاریخ سفارش:</span> {formatPersianDate(attrs.Date)}{" "}
              {formatPersianTime(attrs.createdAt)}
            </span>
            {(attrs.delivery_address?.data?.attributes?.FullAddress || isPreInvoice) && (
              <>
                <span className="text-gray-400">|</span>
                <span>
                  <span className="font-bold">آدرس ارسال:</span>{" "}
                  {getDisplayValue(attrs.delivery_address?.data?.attributes?.FullAddress)}
                </span>
              </>
            )}
            {(attrs.delivery_address?.data?.attributes?.PostalCode || isPreInvoice) && (
              <>
                <span className="text-gray-400">|</span>
                <span>
                  <span className="font-bold">کد پستی:</span>{" "}
                  {getDisplayValue(attrs.delivery_address?.data?.attributes?.PostalCode)}
                </span>
              </>
            )}
            {attrs.shipping?.data?.attributes?.Name && (
              <>
                <span className="text-gray-400">|</span>
                <span>
                  <span className="font-bold">روش حمل و نقل:</span>{" "}
                  {attrs.shipping.data.attributes.Name}
                </span>
              </>
            )}
          </div>
          {(attrs.Description || attrs.Note) && (
            <div className="mt-4 border-t border-gray-300 pt-4">
              <div className="grid grid-cols-2 gap-4 text-right">
                {attrs.Description && (
                  <div>
                    <span className="font-bold">توضیحات سفارش:</span> {attrs.Description}
                  </div>
                )}
                {attrs.Note && (
                  <div>
                    <span className="font-bold">یادداشت:</span> {attrs.Note}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Table */}
        <table className="mb-2 w-full border text-lg">
          <thead className="bg-gray-200">
            <tr className="border">
              <th className="border p-2">ردیف</th>
              <th className="border p-2">تنوع</th>
              <th className="border p-2">محصول</th>
              <th className="border p-2">قیمت</th>
              <th className="border p-2">تعداد</th>
              <th className="border p-2">مبلغ کل</th>
              {attrs.Description && <th className="border p-2">توضیحات سفارش</th>}
            </tr>
          </thead>
          <tbody>
            {attrs.order_items.data.map((item, index) => {
              const a = item.attributes || {};
              const count = Number(a.Count ?? 0);
              const unit = Number(a.PerAmount ?? 0);
              const itemsTotal = count * unit;
              const originalPrice = a.OriginalPrice ? Number(a.OriginalPrice) : undefined;
              const discountPrice = a.DiscountPrice ? Number(a.DiscountPrice) : undefined;
              const hasProductDiscount =
                originalPrice && discountPrice && discountPrice < originalPrice;

              // If you have these relations populated, they render; otherwise they stay empty.
              const color = a.product_color?.data?.attributes?.Title || "";
              const size = a.product_size?.data?.attributes?.Title || "";
              const model = a.product_variation_model?.data?.attributes?.Title || "";

              // Build variation details string
              const variationDetails = [color, size, model].filter(Boolean).join(" | ") || "—";

              // Safer formatter

              return (
                <tr key={item.id} className="break-inside-avoid">
                  <td className="border p-2 text-center">{index + 1}</td>

                  <td className="border p-2">{variationDetails}</td>

                  <td className="border p-2">
                    <div className="flex flex-col">
                      <span>
                        {a.ProductTitle || "—"} - {color ? `  ${color}` : ""}
                      </span>
                    </div>
                  </td>

                  <td className="border p-2 text-center">
                    {hasProductDiscount ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm text-gray-500 line-through">
                          {nf.format(originalPrice)} تومان
                        </span>
                        <span className="font-semibold text-green-600">
                          {nf.format(unit)} <span className="text-sm">تومان</span>
                        </span>
                      </div>
                    ) : (
                      <span>
                        {nf.format(unit)} <span className="text-sm">تومان</span>
                      </span>
                    )}
                  </td>

                  <td className="border p-2 font-bold text-center">{nf.format(count)}</td>

                  <td className="border p-2 text-center font-bold">
                    {nf.format(itemsTotal)}
                    <span className="text-sm">تومان</span>
                  </td>
                  {attrs.Description && (
                    <td className="border p-2 text-right">{attrs.Description}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Row below table */}
        <p className="mb-2 text-lg">تعداد کل: {attrs.order_items.data.length}</p>

        {/* Summary Table */}
        <div className="flex w-full justify-around justify-self-stretch">
          <table className="w-3/4 border border-black text-lg">
            <tbody>
              <tr className="border border-black">
                <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">جمع جزء</td>
                <td className="w-1/2 border p-2 text-center">
                  {hasProductDiscount ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm text-gray-500 line-through">
                        {nf.format(originalSubtotal)} تومان
                      </span>
                      <span className="font-semibold text-green-600">
                        {nf.format(subtotal)} تومان
                      </span>
                    </div>
                  ) : (
                    <span>{nf.format(subtotal)} تومان</span>
                  )}
                </td>
              </tr>
              {hasProductDiscount && (
                <tr className="border border-black">
                  <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">
                    تخفیف محصولات
                  </td>
                  <td className="w-1/2 border p-2 text-center text-green-600">
                    -{nf.format(productDiscount)} تومان
                  </td>
                </tr>
              )}
              {discount > 0 && (
                <tr className="border border-black">
                  <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">
                    تخفیف{discountCode ? ` (کد: ${discountCode})` : ""}
                  </td>
                  <td className="w-1/2 border p-2 text-center text-green-600">
                    -{nf.format(discount)} تومان
                  </td>
                </tr>
              )}
              <tr className="border border-black">
                <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">هزینه ارسال </td>
                <td className="w-1/2 border p-2 text-center">
                  {nf.format(shipping)}
                  تومان
                </td>
              </tr>
              <tr className="border border-black">
                <td className="w-1/2 border bg-gray-100 p-2 text-center font-bold">قابل پرداخت</td>
                <td className="w-1/2 border p-2 text-center">
                  <span className="text-2xl text-pink-600">{nf.format(total)}</span> تومان
                </td>
              </tr>
            </tbody>
          </table>
          <div className="flex flex-col items-start gap-2">
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
            <div className="text-center text-sm font-bold">
              شناسه سفارش: {order.id}
            </div>
          </div>
        </div>

        {/* Footer - Payment method */}
        <div className="mt-6 text-sm font-bold">
          روش پرداخت:{" "}
          {translatePaymentGateway(
            attrs.paymentGateway || attrs.PaymentMethod || attrs.Description,
          )}
        </div>
      </div>
    </div>
  );
}
