import type { Metadata } from "next";
import OtpLoginPageClient from "./OtpLoginPageClient";

export const metadata: Metadata = {
  title: "ورود با کد تایید",
  description: "ورود به حساب کاربری با کد تایید پیامکی.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/login/otp" },
};

export default function OtpLoginPage() {
  return <OtpLoginPageClient />;
}
