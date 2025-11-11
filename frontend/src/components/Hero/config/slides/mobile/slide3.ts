/**
 * Mobile Slide 3
 * Same as slide1 but with contrast effect on primary banner
 */
import { MobileSlideBuilder } from "../../slideFactory";

export const slide3 = new MobileSlideBuilder()
  .heroBanner({
    src: "/images/index-img1-desktop.png",
    alt: "Hero Banner",
    width: 1920,
    height: 560,
    className: "w-full rounded-lg object-cover",
    sizes: "(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw",
  })
  .primaryBanner({
    src: "/images/index-img2-mobile.png",
    alt: "Primary Banner",
    width: 1200,
    height: 600,
    className: "w-full rounded-lg object-cover contrast-[1.03]",
    href: "https://infinitycolor.co/shop/skirt/",
    sizes: "(max-width: 768px) 100vw, 50vw",
  })
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
