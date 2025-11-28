import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org";

export const metadata: Metadata = {
  title: "تسویه حساب",
  description: "تکمیل اطلاعات و تسویه حساب در اینفینیتی استور",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/checkout`,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}



