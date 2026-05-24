import type { Metadata } from "next";
import PaymentFailurePageClient from "./PaymentFailurePageClient";

export const metadata: Metadata = {
  title: "پرداخت ناموفق",
  description: "پرداخت شما با مشکل مواجه شد و تکمیل نشده است.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/payment/failure" },
};

export default function PaymentFailurePage() {
  return <PaymentFailurePageClient />;
}
