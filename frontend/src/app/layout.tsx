import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "../styles/components.css";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next";
import { CartProvider } from "@/contexts/CartContext";
import Providers from "./Providers";
import { peyda, peydaFanum, rokh, kaghaz } from "@/styles/fonts";
import { DebugPanel } from "@/components/Debug";
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
      className={`${peyda.variable} ${peydaFanum.variable} ${rokh.variable} ${kaghaz.variable}`}
    >
      <body className={`${peydaFanum.className} antialiased`}>
        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only fixed top-0 right-0 z-[2147483646] bg-pink-600 text-white px-4 py-2 rounded-b-lg"
        >
          رفتن به محتوای اصلی
        </a>

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
        <DebugPanel />
      </body>
    </html>
  );
}
