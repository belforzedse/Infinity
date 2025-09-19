import type { Metadata } from "next";
import { Provider } from "jotai";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import "../styles/fonts.css";
import { NuqsAdapter } from "nuqs/adapters/next";
import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: {
    default: "اینفینیتی استور",
    template: "%s | اینفینیتی استور",
  },
  description:
    "خرید آنلاین پوشاک زنانه با کیفیت و ارسال سریع از اینفینیتی استور.",
  icons: { icon: "/favicon.png" },
  openGraph: {
    type: "website",
    siteName: "اینفینیتی استور",
    locale: "fa_IR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`font-peyda-fanum antialiased`}>
        <Provider>
          <CartProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </CartProvider>
        </Provider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
