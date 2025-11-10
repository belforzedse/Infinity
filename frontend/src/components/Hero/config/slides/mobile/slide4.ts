/**
 * Mobile Slide 4
 * Different hero + primary images + responsive object-fit
 */
import { MobileSlideBuilder } from "../../slideFactory";

export const slide4 = new MobileSlideBuilder()
  .heroBanner({
    src: "/images/side2.png",
    alt: "Hero Banner",
    width: 1920,
    height: 560,
    className: "w-full rounded-lg object-cover",
    sizes: "(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 100vw",
  })
  .primaryBanner({
    src: "/images/side2.png",
    alt: "Primary Banner",
    width: 1200,
    height: 600,
    className: "w-full rounded-lg object-cover",
    href: "https://infinitycolor.co/shop/skirt/",
    sizes: "(max-width: 768px) 100vw, 50vw",
  })
  .topActionBanner({
    title: "",
    subtitle: "",
    image: {
      src: "/images/bottomright2.png",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg object-contain md:object-cover",
      objectPosition: "center center",
    },
  })
  .bottomActionBanner({
    title: "",
    subtitle: "",
    image: {
      src: "/images/bottomleft2.png",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/skirt/",
      className: "h-full w-full rounded-lg object-contain md:object-cover",
      objectPosition: "center center",
    },
  })
  .build();
