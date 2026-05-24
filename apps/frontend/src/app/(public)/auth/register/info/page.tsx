import type { Metadata } from "next";
import RegisterInfoPageClient from "./RegisterInfoPageClient";

export const metadata: Metadata = {
  title: "تکمیل اطلاعات ثبت‌نام",
  description: "اطلاعات حساب کاربری خود را تکمیل کنید.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/register/info" },
};

export default function RegisterInfoPage() {
  return <RegisterInfoPageClient />;
}
