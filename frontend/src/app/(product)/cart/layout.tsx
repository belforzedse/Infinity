import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "مشاهده و مدیریت سبد خرید خود در اینفینیتی استور",
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



