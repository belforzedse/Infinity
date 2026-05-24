import type { Metadata } from "next";
import AccountPageClient from "./AccountPageClient";

export const metadata: Metadata = {
  title: "حساب من",
  description: "اطلاعات حساب، سفارش‌ها و تنظیمات شخصی خود را مدیریت کنید.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return <AccountPageClient />;
}
