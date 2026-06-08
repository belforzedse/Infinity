import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { Suspense } from "react";
import "@repo/ui/styles.css";
import "../styles/components.css";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next";
import { CartProvider } from "@/contexts/CartContext";
import Providers from "./Providers";
import { peyda, peydaFanum, rokh, kaghaz } from "@repo/fonts";
import { DebugPanel } from "@/components/Debug";
import { NavigationProgress } from "@repo/ui/navigation-progress";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";
import { IMAGE_BASE_URL } from "@/constants/api";
import { SITE_URL } from "@/config/site";
import { getSiteIdentity, resolveSiteName } from "@/services/site-identity";
import { SiteIdentityProvider } from "@/components/providers/SiteIdentityProvider";

const DEFAULT_SITE_DESCRIPTION =
  "فروشگاه پوشاک آنلاین اینفینیتی - جدیدترین محصولات، تخفیف‌ها و پیشنهادهای ویژه";

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  const siteName = resolveSiteName(identity.siteName);
  const description = identity.brandDescription?.trim() || DEFAULT_SITE_DESCRIPTION;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      template: `%s | ${siteName}`,
      default: siteName,
    },
    description,
    keywords: ["پوشاک", "فروشگاه آنلاین", "مد", "لباس", "اینفینیتی", "خرید آنلاین"],
    applicationName: "اینفینیتی",
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      url: SITE_URL,
      siteName,
      title: siteName,
      description,
      images: [
        {
          url: `${SITE_URL}/images/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
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
    verification: {
      google: "l6i1v4-mkeaMxCGEXenzCdyBdhipiZdHuyiaIE011Kg",
    },
  };
}

// Ensure proper mobile scaling and responsiveness
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#3d4c6e", // Infinity primary theme color for mobile browsers
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const identity = await getSiteIdentity();
  const siteName = resolveSiteName(identity.siteName);
  const organizationSocialLinks = identity.socialLinks.map((link) => link.url).filter(Boolean);
  const primaryPhone =
    identity.contactNumbers.find((c) => c.type !== "whatsapp")?.number ??
    identity.contactNumbers[0]?.number;
  const primaryStore = identity.stores[0];

  const defaultApiBaseDomain =
    process.env.NODE_ENV === "production"
      ? "https://api.infinitycolor.co"
      : "http://localhost:1337";

  // Extract base domain for prefetch (API_BASE_URL in constants includes /api suffix)
  const API_BASE_DOMAIN = process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api$/, "")
    : defaultApiBaseDomain;

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

        {/* Critical Peyda Fanum preloads are emitted by next/font (`peydaFanum` in @repo/fonts). */}

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

        {/* OpenSearch descriptor for browser search integration */}
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          href="/opensearch.xml"
          title={siteName}
        />

        {/* PWA Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA meta tags for mobile */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3d4c6e" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${peydaFanum.className} bg-background antialiased`}>
        <NavigationProgress />

        {/* Organization Schema for SEO (driven by site identity, with fallbacks) */}
        <OrganizationSchema
          name={siteName}
          description={identity.brandDescription}
          email={identity.contactEmail}
          phone={primaryPhone}
          sameAs={organizationSocialLinks}
          streetAddress={primaryStore?.address}
        />

        {/* Skip to main content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only fixed right-0 top-0 z-[9999] rounded-b-lg bg-infinity-primary px-4 py-2 text-white focus:not-sr-only"
        >
          رفتن به محتوای اصلی
        </a>

        <SiteIdentityProvider identity={identity}>
          <CartProvider>
            <NuqsAdapter>
              <Providers>
                <Suspense fallback={null}>
                  <div id="main-content">{children}</div>
                </Suspense>
              </Providers>
            </NuqsAdapter>
          </CartProvider>
        </SiteIdentityProvider>
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
