import type { Metadata } from "next";
import ForgotPasswordPageClient from "./ForgotPasswordPageClient";

export const metadata: Metadata = {
  title: "بازیابی رمز عبور",
  description: "رمز عبور حساب کاربری خود را بازیابی کنید.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/forgot-password" },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
