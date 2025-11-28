import AuthForm from "@/components/Auth/Form";
import type { Metadata } from "next";

export default function AuthPage() {
  return <AuthForm />;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org";

export const metadata: Metadata = {
  title: "احراز هویت | اینفینیتی استور",
  description: "ورود یا ثبت‌نام در اینفینیتی استور.",
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/auth` },
};
