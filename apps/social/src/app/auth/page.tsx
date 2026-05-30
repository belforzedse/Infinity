import type { Metadata } from "next";
import AuthForm from "@/components/Auth/Form";
import { SITE_NAME } from "@/config/site";

export default function AuthPage() {
  return <AuthForm />;
}

export const metadata: Metadata = {
  title: "ورود",
  description: `ورود یا ثبت‌نام در ${SITE_NAME}.`,
  robots: { index: false, follow: false },
};
