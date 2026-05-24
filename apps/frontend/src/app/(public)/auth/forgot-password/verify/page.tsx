import type { Metadata } from "next";
import ForgotPasswordVerifyPageClient from "./ForgotPasswordVerifyPageClient";

export const metadata: Metadata = {
  title: "تایید بازیابی رمز عبور",
  description: "کد تایید بازیابی رمز عبور را وارد کنید.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/forgot-password/verify" },
};

export default function ForgotPasswordVerifyPage() {
  return <ForgotPasswordVerifyPageClient />;
}
