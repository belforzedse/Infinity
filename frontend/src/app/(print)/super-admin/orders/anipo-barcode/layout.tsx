import type { Metadata } from "next";
import "../print/print.css";
import "./print.css";

export const metadata: Metadata = {
  title: "چاپ بارکد آنیپو",
  description: "صفحه چاپ بارکد آنیپو",
};

export default function AnipoBarcodePrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-white">{children}</body>
    </html>
  );
}
