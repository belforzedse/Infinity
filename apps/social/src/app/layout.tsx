import type { Metadata, Viewport } from "next";
import { peyda, peydaFanum, rokh, kaghaz } from "@repo/fonts";
import { Providers } from "@/app/providers";
import { AppChrome } from "@/components/AppChrome";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
import { SITE_NAME, SITE_URL } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "شبکه اجتماعی اینفینیتی",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: "شبکه اجتماعی اینفینیتی",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "fa_IR",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#3d4c6e",
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
          <NavigationProgress />
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
