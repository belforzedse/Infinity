/**
 * Tablet Slide 1
 * Hero banner + left action banners + right banner with background
 */
import { TabletSlideBuilder } from "../../slideFactory";

export const slide1 = new TabletSlideBuilder()
  // Hero banner on top
  .heroBanner({
    src: "/images/hero2.png",
    alt: "Hero Banner",
    width: 1920,
    height: 560,
    className: "w-full rounded-lg object-cover",
  })
  // Left top action banner (image only)
  .leftBannerTop({
    title: "",
    subtitle: "",
    image: {
      src: "/images/bottomright2.png",
      alt: "Category Banner",
      width: 400,
      height: 280,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg object-cover",
    },
  })
  // Left bottom action banner (image only)
  .leftBannerBottom({
    title: "",
    subtitle: "",
    image: {
      src: "/images/bottomleft2.png",
      alt: "Category Banner",
      width: 400,
      height: 280,
      href: "https://infinitycolor.co/shop/skirt/",
      className: "h-full w-full rounded-lg object-cover",
    },
  })
  // Right banner with background + foreground
  .rightBanner({
    background: { type: "color", value: "bg-slate-50" },
    foregroundImage: {
      src: "/images/side2.png",
      alt: "Hero Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/skirt/",
      className: "h-full w-full rounded-lg object-cover",
    },
  })
  .build();
