import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: `مشاهده و مدیریت سبد خرید خود در ${SITE_NAME}`,
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/cart`,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}



