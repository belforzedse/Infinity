import type { Metadata } from "next";
import RegisterPageClient from "./RegisterPageClient";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  description: "ایجاد حساب کاربری در فروشگاه پوشاک اینفینیتی.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/register" },
};

export default function RegisterPage() {
  return <RegisterPageClient />;
}
