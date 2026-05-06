import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/config/site";

export default function PrivilegesPage() {
  return <div>PrivilegesPage</div>;
}

export const metadata: Metadata = {
  title: `مزایا و امتیازات | ${SITE_NAME}`,
  description: "مشاهده مزایا و امتیازات حساب کاربری.",
  alternates: { canonical: `${SITE_URL}/privileges` },
};
