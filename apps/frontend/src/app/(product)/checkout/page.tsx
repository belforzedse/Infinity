import type { Metadata } from "next";
import { SITE_URL } from "@/config/site";
import CheckoutPageClient from "./CheckoutPageClient";

export const metadata: Metadata = {
  title: "تسویه حساب",
  description: "اطلاعات ارسال و پرداخت خود را برای نهایی‌سازی سفارش تکمیل کنید.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/checkout`,
  },
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
