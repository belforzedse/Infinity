import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org";

export default function PrivilegesPage() {
  return <div>PrivilegesPage</div>;
}

export const metadata: Metadata = {
  title: "مزایا و امتیازات | اینفینیتی استور",
  description: "مشاهده مزایا و امتیازات حساب کاربری.",
  alternates: { canonical: `${SITE_URL}/privileges` },
};
