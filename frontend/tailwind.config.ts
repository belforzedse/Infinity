import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#FFFFFF", // Design-Token: 700
          secondary: "#FAFAF9", // Design-Token: 700 (cart)
          form: "#F8FAFC", // slate-50 for form inputs
          pink: "#EC4899",
        },
        foreground: {
          primary: "#262626", // Design-Token: 500
          secondary: "#1C1C1C", // Used with 0.6 opacity
          muted: "#A3A3A3", // Used in form inputs
          pink: "#EC4899",
        },
        actions: {
          primary: "#EC4899",
          link: "#2563EB",
        },
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      fontFamily: {
        "peyda-fanum": ["Peyda-Fanum"],
        peyda: ["Peyda"],
      },

      fontWeight: {
        regular: "400",
        medium: "500",
        bold: "700",
      },
      fontSize: {
        // Mobile (DEFAULT)
        xxs: ["8px", { lineHeight: "auto" }],
        xs: ["10px", { lineHeight: "16px" }],
        sm: ["12px", { lineHeight: "20px" }],
        base: ["14px", { lineHeight: "24px" }],
        lg: ["16px", { lineHeight: "28px" }],
        xl: ["18px", { lineHeight: "24px" }],
        "2xl": ["20px", { lineHeight: "32px" }],
        "3xl": ["24px", { lineHeight: "36px" }],
        "4xl": ["30px", { lineHeight: "auto" }],
        "5xl": ["36px", { lineHeight: "auto" }],
        "6xl": ["48px", { lineHeight: "auto" }],
        "7xl": ["60px", { lineHeight: "auto" }],
        "8xl": ["72px", { lineHeight: "auto" }],
        "9xl": ["96px", { lineHeight: "auto" }],
      },
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        // Tablet (sm)
        "@screen sm": {
          ".text-xxs": {
            fontSize: "9px !important",
            lineHeight: "auto important",
          },
          ".text-xs": {
            fontSize: "11px !important",
            lineHeight: "18px !important",
          },
          ".text-sm": {
            fontSize: "13px !important",
            lineHeight: "22px !important",
          },
          ".text-base": {
            fontSize: "15px !important",
            lineHeight: "28px !important",
          },
          ".text-lg": {
            fontSize: "17px !important",
            lineHeight: "30px !important",
          },
          ".text-xl": {
            fontSize: "19px !important",
            lineHeight: "26px !important",
          },
          ".text-2xl": {
            fontSize: "22px !important",
            lineHeight: "36px !important",
          },
          ".text-3xl": {
            fontSize: "27px !important",
            lineHeight: "40px !important",
          },
          ".text-4xl": {
            fontSize: "33px !important",
            lineHeight: "auto important",
          },
          ".text-5xl": {
            fontSize: "42px !important",
            lineHeight: "auto important",
          },
          ".text-6xl": {
            fontSize: "54px !important",
            lineHeight: "auto important",
          },
          ".text-7xl": {
            fontSize: "66px !important",
            lineHeight: "auto important",
          },
          ".text-8xl": {
            fontSize: "84px !important",
            lineHeight: "auto important",
          },
          ".text-9xl": {
            fontSize: "112px !important",
            lineHeight: "auto important",
          },
        },
        // Desktop (lg)
        "@screen lg": {
          ".text-xxs": {
            fontSize: "10px !important",
            lineHeight: "auto !important",
          },
          ".text-xs": {
            fontSize: "12px !important ",
            lineHeight: "20px !important",
          },
          ".text-sm": {
            fontSize: "14px !important",
            lineHeight: "26px !important",
          },
          ".text-base": {
            fontSize: "16px !important",
            lineHeight: "34px !important",
          },
          ".text-lg": {
            fontSize: "18px !important",
            lineHeight: "32px !important",
          },
          ".text-xl": {
            fontSize: "20px !important",
            lineHeight: "28px !important",
          },
          ".text-2xl": {
            fontSize: "24px !important",
            lineHeight: "40px !important",
          },
          ".text-3xl": {
            fontSize: "30px !important",
            lineHeight: "47px !important",
          },
          ".text-4xl": {
            fontSize: "36px !important",
            lineHeight: "auto !important",
          },
          ".text-5xl": {
            fontSize: "48px !important",
            lineHeight: "auto !important",
          },
          ".text-6xl": {
            fontSize: "60px !important",
            lineHeight: "auto !important",
          },
          ".text-7xl": {
            fontSize: "72px !important",
            lineHeight: "auto !important",
          },
          ".text-8xl": {
            fontSize: "96px !important",
            lineHeight: "auto !important",
          },
          ".text-9xl": {
            fontSize: "128px !important",
            lineHeight: "auto !important",
          },
        },
      });
    }),
    require("tailwind-scrollbar")({
      nocompatible: true,
      themeKey: "scrollbar",
    }),
  ],
} satisfies Config;
