import type { Metadata } from "next";
import PasswordPageClient from "./PasswordPageClient";

export const metadata: Metadata = {
  title: "تغییر رمز عبور",
  description: "برای امنیت بیشتر حساب، رمز عبور خود را به‌روزرسانی کنید.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/password" },
};

export default function PasswordPage() {
  return <PasswordPageClient />;
}
