import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/config/site";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = {
  title: `سبد خرید | ${SITE_NAME}`,
  description: "محصولات انتخاب‌شده خود را بازبینی و برای تکمیل خرید آماده شوید.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/cart`,
  },
};

export default function CartPage() {
  return <CartPageClient />;
}
