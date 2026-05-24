import type { Metadata } from "next";
import ReserveGroupPageClient from "./ReserveGroupPageClient";

export const metadata: Metadata = {
  title: "سفارش رزروی",
  description: "جزئیات سفارش‌های رزروی خود را مشاهده و مدیریت کنید.",
  robots: { index: false, follow: false },
};

export default function ReserveGroupPage() {
  return <ReserveGroupPageClient />;
}
