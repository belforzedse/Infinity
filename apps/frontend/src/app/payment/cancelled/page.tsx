import type { Metadata } from "next";
import PaymentCancelledPageClient from "./PaymentCancelledPageClient";

export const metadata: Metadata = {
  title: "پرداخت لغو شد",
  description: "فرآیند پرداخت لغو شد و مبلغی از حساب شما کسر نشده است.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/payment/cancelled" },
};

export default function PaymentCancelledPage() {
  return <PaymentCancelledPageClient />;
}
