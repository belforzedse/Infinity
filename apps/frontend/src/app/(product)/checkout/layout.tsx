import { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "تسویه حساب",
  description: `تکمیل اطلاعات و تسویه حساب در ${SITE_NAME}`,
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



