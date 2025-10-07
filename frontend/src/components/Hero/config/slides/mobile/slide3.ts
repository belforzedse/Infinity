import { MobileSlideBuilder } from "../../slideFactory";

export const slide3 = new MobileSlideBuilder()
  .heroDesktop({
    src: "/images/index-img1-desktop.png",
  })
  .heroMobile({
    src: "/images/index-img1-mobile.png",
  })
  .secondaryPrimary({
    src: "/images/index-img2-mobile.png",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .secondaryTop({
    src: "/images/index-img3-desktop.png",
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
  })
  .secondaryBottom({
    src: "/images/index-img4-desktop.png",
    href: "https://infinitycolor.co/shop/skirt/",
  })
  .appendClassName("secondaryPrimary", "contrast-[1.03]")
  .build();
