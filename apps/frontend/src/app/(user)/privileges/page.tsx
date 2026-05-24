import type { Metadata } from "next";
import { SITE_URL } from "@/config/site";

export default function PrivilegesPage() {
  return <div>PrivilegesPage</div>;
}

export const metadata: Metadata = {
  title: "مزایا و امتیازات",
  description: "مشاهده مزایا و امتیازات حساب کاربری.",
  alternates: { canonical: `${SITE_URL}/privileges` },
};
