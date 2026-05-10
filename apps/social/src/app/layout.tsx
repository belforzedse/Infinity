import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "اینفینیتی‌گرام",
  description: "شبکه اجتماعی اینفینیتی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="antialiased">
      <body className="min-h-dvh flex flex-col bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
