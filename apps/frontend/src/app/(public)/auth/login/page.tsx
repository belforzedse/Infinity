import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب کاربری در فروشگاه پوشاک اینفینیتی.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/login" },
};

export default function LoginPage() {
  return <LoginPageClient />;
}
