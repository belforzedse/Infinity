import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import "../styles/components.css";
import { NuqsAdapter } from "nuqs/adapters/next";
import { CartProvider } from "@/contexts/CartContext";
import Providers from "./Providers";
import { peyda, peydaFanum } from "@/styles/fonts";
export const metadata: Metadata = {
  title: "اینفینیتی ∞ Infinity",
  description: "فروشگاه پوشاک اینفینیتی",
};

// Ensure proper mobile scaling and responsiveness
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
      className={`${peyda.variable} ${peydaFanum.variable}`}
    >
      <body className={`${peydaFanum.className} antialiased`}>
        <CartProvider>
          <NuqsAdapter>
            <Providers>{children}</Providers>
          </NuqsAdapter>
        </CartProvider>
        <Toaster
          position="bottom-center"
          containerStyle={{ zIndex: 2147483647 }}
          toastOptions={{
            style: { zIndex: 2147483647 },
          }}
        />
      </body>
    </html>
  );
}
