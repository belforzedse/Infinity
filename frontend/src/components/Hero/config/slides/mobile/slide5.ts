import { MobileSlideBuilder } from "../../slideFactory";

export const slide5 = new MobileSlideBuilder()
  .heroDesktop({
    src: "/images/side3.png",
  })
  .heroMobile({
    src: "/images/hero1.png",
  })
  .secondaryPrimary({
    src: "/images/side3.png",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .secondaryTop({
    src: "/images/bottomleft3.png",
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
    className: "h-full w-full rounded-lg object-contain md:object-cover",
    objectPosition: "center center",
  })
  .secondaryBottom({
    src: "/images/bottomright3.png",
    className: "h-full w-full rounded-lg object-contain md:object-cover",
    objectPosition: "center center",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .build();
