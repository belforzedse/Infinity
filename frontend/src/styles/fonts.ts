import localFont from "next/font/local";

export const peyda = localFont({
  src: [
    {
      path: "../../public/fonts/peyda-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/peyda-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/peyda-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-peyda",
});

export const peydaFanum = localFont({
  src: [
    {
      path: "../../public/fonts/peyda-regular-fanum.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/peyda-medium-fanum.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/peyda-bold-fanum.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-peyda-fanum",
});

export const rokh = localFont({
  src: [
    {
      path: "../../public/fonts/woff2/Rokh-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/woff2/Rokh-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/woff2/Rokh-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/woff2/Rokh-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/woff2/Rokh-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/woff2/Rokh-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-rokh",
});
