import type { Metadata } from "next";
import OrdersPageClient from "./OrdersPageClient";

export const metadata: Metadata = {
  title: "تاریخچه سفارش‌ها",
  description: "سفارش‌های خود را ردیابی کنید و جزئیات هر سفارش را ببینید.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/orders" },
};

export default function OrdersPage() {
  return <OrdersPageClient />;
}
