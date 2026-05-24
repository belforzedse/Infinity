import type { Metadata } from "next";
import WalletPageClient from "./WalletPageClient";

export const metadata: Metadata = {
  title: "کیف پول",
  description: "موجودی کیف پول و سوابق تراکنش‌های خود را مدیریت کنید.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/wallet" },
};

export default function WalletPage() {
  return <WalletPageClient />;
}
