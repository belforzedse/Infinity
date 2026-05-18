import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "infinitygram",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "شبکه اجتماعی اینفینیتی",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f9faff",
    theme_color: "#3d4c6e",
    lang: "fa-IR",
    dir: "rtl",
    categories: ["social", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "خانه",
        short_name: "خانه",
        description: "باز کردن فید اصلی",
        url: "/",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "جستجو",
        short_name: "جستجو",
        description: "جستجوی پست‌ها",
        url: "/search",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "پروفایل",
        short_name: "پروفایل",
        description: "باز کردن پروفایل",
        url: "/profile",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
