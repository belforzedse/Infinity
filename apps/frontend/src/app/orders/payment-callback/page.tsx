import type { Metadata } from "next";
import PaymentCallbackPageClient from "./PaymentCallbackPageClient";

export const metadata: Metadata = {
  title: "بررسی وضعیت پرداخت",
  description: "وضعیت پرداخت سفارش در حال بررسی است.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/orders/payment-callback" },
};

export default function PaymentCallbackPage() {
  return <PaymentCallbackPageClient />;
}
