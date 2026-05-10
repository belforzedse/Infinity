import localFont from "next/font/local";

/** Peyda (Latin / non–Persian numerals). CSS variable: `--font-peyda`. */
export const peyda = localFont({
  src: [
    {
      path: "../assets/peyda-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/peyda-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/peyda-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-peyda",
});

/** Peyda with Persian numerals (preferred for storefront body). */
export const peydaFanum = localFont({
  src: [
    {
      path: "../assets/peyda-regular-fanum.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/peyda-medium-fanum.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/peyda-bold-fanum.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-peyda-fanum",
  preload: true,
  adjustFontFallback: false,
});

/** Rokh display family. */
export const rokh = localFont({
  src: [
    {
      path: "../assets/woff2/Rokh-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/woff2/Rokh-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/woff2/Rokh-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../assets/woff2/Rokh-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/woff2/Rokh-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../assets/woff2/Rokh-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-rokh",
});

/** Kaghaz decorative face. */
export const kaghaz = localFont({
  src: [
    {
      path: "../assets/kaghaz.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-kaghaz",
  adjustFontFallback: false,
});
