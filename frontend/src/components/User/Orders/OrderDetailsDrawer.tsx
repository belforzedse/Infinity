"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useMemo } from "react";
import XIcon from "@/components/User/Icons/XIcon";
import { faNum } from "@/utils/faNum";
import type { Order, OrderItem } from "@/services/order";
import PaymentStatusButton from "./PaymentStatusButton";
import Link from "next/link";

interface OrderDetailsDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

type StatusTone = "info" | "success" | "warning" | "danger";

const statusLabelMap: Record<string, { label: string; tone: StatusTone }> =
  {
    started: { label: "ثبت شده", tone: "info" },
    processing: { label: "در حال آماده‌سازی", tone: "info" },
    paying: { label: "در حال پرداخت", tone: "info" },

    shipment: { label: "در حال ارسال", tone: "warning" },
    done: { label: "تحویل شده", tone: "success" },
    delivered: { label: "تحویل شده", tone: "success" },
    cancelled: { label: "لغو شده", tone: "danger" },
    canceled: { label: "لغو شده", tone: "danger" },
  };

const toneClasses = (tone: "info" | "success" | "warning" | "danger") => {
  switch (tone) {
    case "success":
      return "bg-green-50 text-green-600";
    case "warning":
      return "bg-yellow-50 text-yellow-600";
    case "danger":
      return "bg-red-50 text-red-600";
    default:
      return "bg-blue-50 text-blue-600";
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const dateText = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
    const timeText = new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    return `${timeText} - ${dateText}`;
  } catch {
    return "—";
  }
};

const getItemTitle = (item: OrderItem) => {
  return (
    item.ProductTitle ||
    item.product_variation?.product?.Title ||
    item.product_variation?.product?.cover_image?.url ||
    "محصول"
  );
};

const getVariationDescription = (item: OrderItem) => {
  const parts: string[] = [];
  const { product_variation: variation } = item;
  if (!variation) return "";

  const color = variation.product_color?.Title;
  const size = variation.product_size?.Title;
  const model = variation.product_variation_model?.Title;

  if (color) parts.push(`رنگ: ${color}`);
  if (size) parts.push(`سایز: ${size}`);
  if (model) parts.push(`مدل: ${model}`);

  return parts.join(" | ");
};

const getStatusInfo = (status?: string): { label: string; tone: StatusTone } => {
  const key = status?.toLowerCase?.() || "";
  if (!status) {
    return { label: "نامشخص", tone: "info" };
  }

  const mapped = statusLabelMap[key];
  if (mapped) return mapped;

  return { label: status, tone: "info" };
};

const calculateTotals = (order: Order) => {
  const subtotal = order.order_items.reduce((sum, item) => {
    const count = Number(item.Count || 0);
    const perAmount = Number(item.PerAmount || 0);
    return sum + count * perAmount;
  }, 0);

  const shipping = Number(order.ShippingCost || 0);
  const total = subtotal + shipping;

  return { subtotal, shipping, total };
};

export default function OrderDetailsDrawer({ order, isOpen, onClose }: OrderDetailsDrawerProps) {
  const totals = useMemo(() => {
    if (!order) return { subtotal: 0, shipping: 0, total: 0 };
    return calculateTotals(order);
  }, [order]);

  const statusInfo = order ? getStatusInfo(order.Status) : null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1200]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto" dir="rtl">
          <div className="flex min-h-full justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative flex h-full w-full max-w-xl flex-col gap-6 overflow-y-auto bg-white px-6 py-6 shadow-xl sm:rounded-s-3xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <Dialog.Title className="text-lg font-semibold text-foreground-primary lg:text-xl">
                      جزئیات سفارش
                    </Dialog.Title>
                    {order ? (
                      <p className="text-sm text-slate-500">
                        سفارش شماره #{faNum(order.id)} • ثبت شده در {formatDate(order.createdAt)}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100"
                    onClick={onClose}
                    aria-label="بستن"
                  >
                    <XIcon />
                  </button>
                </div>

                {order ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="text-slate-500">وضعیت:</span>
                      <span className={`rounded-full px-3 py-1 ${statusInfo ? toneClasses(statusInfo.tone) : ""}`}>
                        {statusInfo?.label ?? order.Status}
                      </span>
                      {order.ShippingBarcode ? (
                        <Link
                          href={`https://anipo.ir/checkconsignment/?code=${order.ShippingBarcode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-pink-200 px-3 py-1 text-xs text-pink-600 transition hover:bg-pink-50"
                        >
                          رهگیری مرسوله
                        </Link>
                      ) : null}
                      <PaymentStatusButton orderId={order.id} />
                    </div>

                    <section className="flex flex-col gap-3">
                      <h3 className="text-base font-semibold text-foreground-primary">اقلام سفارش</h3>
                      <div className="flex flex-col divide-y divide-slate-100 rounded-2xl border border-slate-100">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col gap-1 text-right">
                              <span className="text-sm font-medium text-foreground-primary">
                                {getItemTitle(item)}
                              </span>
                              {getVariationDescription(item) ? (
                                <span className="text-xs text-slate-500">{getVariationDescription(item)}</span>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                              <span>تعداد: {faNum(item.Count)}</span>
                              <span>قیمت واحد: {faNum(item.PerAmount)} تومان</span>
                              <span className="font-semibold text-foreground-primary">
                                جمع: {faNum(Number(item.Count) * Number(item.PerAmount))} تومان
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                      <h3 className="text-base font-semibold text-foreground-primary">خلاصه پرداخت</h3>
                      <div className="flex flex-col gap-2 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                          <span>جمع اقلام</span>
                          <span>{faNum(totals.subtotal)} تومان</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>هزینه ارسال</span>
                          <span>{faNum(totals.shipping)} تومان</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-foreground-primary">
                          <span>مبلغ کل</span>
                          <span>{faNum(totals.total)} تومان</span>
                        </div>
                      </div>
                    </section>

                    {order.Description || order.Note ? (
                      <section className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
                        <h3 className="text-base font-semibold text-amber-700">یادداشت سفارش</h3>
                        {order.Description ? (
                          <p className="text-sm text-amber-700">{order.Description}</p>
                        ) : null}
                        {order.Note ? <p className="text-sm text-amber-700">{order.Note}</p> : null}
                      </section>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center">
                    <span className="text-sm text-slate-500">سفارشی برای نمایش انتخاب نشده است.</span>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

