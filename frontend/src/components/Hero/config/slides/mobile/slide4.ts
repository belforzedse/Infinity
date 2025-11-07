import { MobileSlideBuilder } from "../../slideFactory";

export const slide4 = new MobileSlideBuilder()
  .heroDesktop({
    src: "/images/side2.png",
  })
  .heroMobile({
    src: "/images/hero2.png",
  })
  .secondaryPrimary({
    src: "/images/side2.png",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .secondaryTop({
    src: "/images/bottomright2.png",
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
    className: "h-full w-full rounded-lg object-contain md:object-cover",
    objectPosition: "center center",
  })
  .secondaryBottom({
    src: "/images/bottomleft2.png",
    className: "h-full w-full rounded-lg object-contain md:object-cover",
    objectPosition: "center center",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .build();
