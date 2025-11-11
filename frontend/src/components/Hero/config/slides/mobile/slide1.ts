/**
 * Mobile Slide 1
 * Responsive hero banner + primary banner + action banners
 * Note: Use responsive images via sizes prop for best mobile/tablet experience
 */
import { MobileSlideBuilder } from "../../slideFactory";

export const slide1 = new MobileSlideBuilder()
  // Hero banner (responsive with sizes to handle different viewports)
  .heroBanner({
    src: "/images/index-img1-desktop.png",
    alt: "Hero Banner",
    width: 1920,
    height: 560,
    className: "w-full rounded-lg object-cover",
    sizes: "(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw",
    priority: true,
    loading: "eager",
  })
  // Primary banner (large image below hero)
  .primaryBanner({
    src: "/images/index-img2-mobile.png",
    alt: "Primary Banner",
    width: 1200,
    height: 600,
    className: "w-full rounded-lg object-cover",
    href: "https://infinitycolor.co/shop/skirt/",
    sizes: "(max-width: 768px) 100vw, 50vw",
  })
  // Top action banner (image only, no text)
  .topActionBanner({
    title: "",
    subtitle: "",
    image: {
      src: "/images/index-img3-desktop.png",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg object-cover",
    },
  })
  // Bottom action banner (image only, no text)
  .bottomActionBanner({
    title: "",
    subtitle: "",
    image: {
      src: "/images/index-img4-desktop.png",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/skirt/",
      className: "h-full w-full rounded-lg object-cover",
    },
  })
  .build();
