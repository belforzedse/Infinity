import AuthForm from "@/components/Auth/Form";
import type { Metadata } from "next";

export default function AuthPage() {
  return <AuthForm />;
}

export const metadata: Metadata = {
  title: "احراز هویت | اینفینیتی استور",
  description: "ورود یا ثبت‌نام در اینفینیتی استور.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth" },
};
