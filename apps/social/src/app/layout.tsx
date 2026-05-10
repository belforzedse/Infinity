import type { Metadata } from "next";
import { peyda, peydaFanum, rokh, kaghaz } from "@repo/fonts";
import { Providers } from "@/app/providers";
import { AppChrome } from "@/components/AppChrome";
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
    <html
      lang="fa"
      dir="rtl"
      className={`${peyda.variable} ${peydaFanum.variable} ${rokh.variable} ${kaghaz.variable} antialiased`}
    >
      <body className={`min-h-dvh flex flex-col bg-background text-zinc-900 ${peydaFanum.className}`}>
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
