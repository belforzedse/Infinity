import type { Metadata } from "next";
import AddressesPageClient from "./AddressesPageClient";

export const metadata: Metadata = {
  title: "آدرس‌های من",
  description: "آدرس‌های ذخیره‌شده برای پرداخت سریع و ارسال سفارش را مدیریت کنید.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/addresses" },
};

export default function AddressesPage() {
  return <AddressesPageClient />;
}
