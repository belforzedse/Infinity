import type { Metadata } from "next";
import OrderFailurePageClient from "./OrderFailurePageClient";

export const metadata: Metadata = {
  title: "پرداخت ناموفق",
  description: "پرداخت سفارش با مشکل مواجه شد و سفارش تکمیل نشده است.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/orders/failure" },
};

export default function OrderFailurePage() {
  return <OrderFailurePageClient />;
}
