import { TabletSlideBuilder } from "../../slideFactory";

export const slide2 = new TabletSlideBuilder()
  .heroBanner({
    src: "/images/hero1.png",
  })
  .rightBanner({
    src: "/images/side3.png",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .leftTopBanner({
    src: "/images/bottomleft3.png",
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
  })
  .leftBottomBanner({
    src: "/images/bottomright3.png",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .build();
