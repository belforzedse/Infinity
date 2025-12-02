import AuthForm from "@/components/Auth/Form";
import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/config/site";

export default function AuthPage() {
  return <AuthForm />;
}

export const metadata: Metadata = {
  title: `احراز هویت | ${SITE_NAME}`,
  description: `ورود یا ثبت‌نام در ${SITE_NAME}.`,
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}/auth` },
};
