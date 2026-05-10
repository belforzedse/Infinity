import type { Metadata } from "next";
import AuthForm from "@/components/Auth/Form";

export default function AuthPage() {
  return <AuthForm />;
}

export const metadata: Metadata = {
  title: "ورود | اینفینیتی‌گرام",
  description: "ورود یا ثبت‌نام در اینفینیتی‌گرام.",
  robots: { index: false, follow: false },
};
