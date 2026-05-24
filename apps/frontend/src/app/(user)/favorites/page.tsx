import type { Metadata } from "next";
import FavoritesPageClient from "./FavoritesPageClient";

export const metadata: Metadata = {
  title: "علاقه‌مندی‌ها",
  description: "محصولات مورد علاقه خود را مرور کنید و خریدتان را تکمیل کنید.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/favorites" },
};

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
