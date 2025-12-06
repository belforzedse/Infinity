import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "../styles/components.css";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next";
import { CartProvider } from "@/contexts/CartContext";
import Providers from "./Providers";
import { peyda, peydaFanum, rokh, kaghaz } from "@/styles/fonts";
import { DebugPanel } from "@/components/Debug";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";
import { IMAGE_BASE_URL } from "@/constants/api";
import { SITE_URL, SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} | فروشگاه پوشاک آنلاین`,
  },
  description: "فروشگاه پوشاک آنلاین اینفینیتی - جدیدترین محصولات، تخفیف‌ها و پیشنهادهای ویژه",
  keywords: ["پوشاک", "فروشگاه آنلاین", "مد", "لباس", "اینفینیتی", "خرید آنلاین"],
  applicationName: "اینفینیتی",
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "فروشگاه پوشاک آنلاین اینفینیتی - جدیدترین محصولات، تخفیف‌ها و پیشنهادهای ویژه",
    images: [
      {
        url: `${SITE_URL}/images/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "فروشگاه پوشاک آنلاین اینفینیتی - جدیدترین محصولات، تخفیف‌ها و پیشنهادهای ویژه",
    images: [`${SITE_URL}/images/og-default.jpg`],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "fa-IR": SITE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Ensure proper mobile scaling and responsiveness
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#ec4899", // Pink theme color for mobile browsers
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Extract base domain for prefetch (API_BASE_URL in constants includes /api suffix)
  const API_BASE_DOMAIN = process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api$/, '')
    : "http://localhost:1337";

  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${peyda.variable} ${peydaFanum.variable} ${rokh.variable} ${kaghaz.variable}`}
    >
      <head>
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />

        {/* Preload critical fonts - prioritize above-the-fold content */}
        <link
          rel="preload"
          href="/fonts/peyda-regular-fanum.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/peyda-bold-fanum.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for external domains - API first for critical requests */}
        <link rel="dns-prefetch" href={API_BASE_DOMAIN} />
        <link rel="dns-prefetch" href={IMAGE_BASE_URL || API_BASE_DOMAIN} />
        <link rel="dns-prefetch" href="https://www.instagram.com" />
        <link rel="dns-prefetch" href="https://www.telegram.org" />

        {/* Preconnect to API for faster requests - critical for initial load */}
        {/* Establishes early connection (DNS + TCP + TLS) for faster API requests */}
        <link rel="preconnect" href={API_BASE_DOMAIN} crossOrigin="anonymous" />
        <link rel="preconnect" href={IMAGE_BASE_URL || API_BASE_DOMAIN} crossOrigin="anonymous" />

        {/* Prefetch likely next-page resources - lower priority */}
        <link rel="prefetch" href="/plp" as="document" />
        <link rel="prefetch" href="/blog" as="document" />

        {/* Preload critical images for mobile performance */}
        <link
          rel="preload"
          href="/images/og-default.jpg"
          as="image"
          type="image/jpeg"
        />

        {/* OpenSearch descriptor for browser search integration */}
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          href="/opensearch.xml"
          title={SITE_NAME}
        />

        {/* PWA Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA meta tags for mobile */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ec4899" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${peydaFanum.className} bg-white antialiased`}>
        {/* Organization Schema for SEO */}
        <OrganizationSchema />

        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only fixed right-0 top-0 z-[9999] rounded-b-lg bg-pink-600 px-4 py-2 text-white focus:not-sr-only"
        >
          رفتن به محتوای اصلی
        </a>

        <CartProvider>
          <NuqsAdapter>
            <Providers>
              <div id="main-content">{children}</div>
            </Providers>
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
