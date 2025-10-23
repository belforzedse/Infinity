import { TabletSlideBuilder } from "../../slideFactory";

export const slide1 = new TabletSlideBuilder()
  .heroBanner({
    src: "/images/hero2.png",
  })
  .rightBanner({
    src: "/images/side2.png",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .leftTopBanner({
    src: "/images/bottomright2.png",
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
  })
  .leftBottomBanner({
    src: "/images/bottomleft2.png",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .build();
