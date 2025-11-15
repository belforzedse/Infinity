/**
 * Tablet Slide 1
 * Premium layout with hero square + styled text banner + rich action banners
 */
import { TabletSlideBuilder } from "../../slideFactory";

export const slide2 = new TabletSlideBuilder()
  // Hero banner (square with background + foreground)
  .primaryBanner({
    title: "بزار استـــــــــایـــــــلت حرف بزنه",
    subtitle: "پوشاک کاربردی، طراحی هوشمند.",
    className: "w-full gap-[8px] rounded-3xl px-[24px] pb-[40px] pt-[20px]",
    colors: {
      background: "bg-slate-50",
      titleColor: "text-[#A28471]",
      subtitleColor: "text-gray-600",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "sl:text-[65px] text-[60px] ",
      titleWeight: "font-bold",
      titleTracking: "tracking-tight",
      subtitleSize: "sl:text-[30px] text-2xl",
      subtitleWeight: "font-semibold",
      titleLeading: "leading-relaxed",
      subtitleLeading: "leading-relaxed",
    },
  })
  .heroBanner({
    background: {
      type: "image",
      value: "/images/HeroSlider/Square/Slide2Background.png",
      alt: "Background",
      width: "100%",
      height: "80%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-lg",
    },
    foregroundImage: {
      src: "/images/HeroSlider/Square/Slide2Foreground.png",
      alt: "Hero Banner",
      width: 600,
      height: 600,
      priority: true,
      loading: "eager",
      className: "object-contain w-[99%] scale-125 h-[99%] translate-y-8",
      objectPosition: "bottom center",
    },
  })
  // Bottom left action banner
  .bottomActionBannerLeft({
    title: "پلیور ها",
    subtitle: "",
    image: {
      src: "/images/HeroSlider/ActionBannerRight/Slide2.webp",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className:
        "h-full w-full rounded-lg mb-2 scale-110 translate-x-2 -translate-y-6 object-contain",
      objectPosition: " ",
    },
    className: "min-h-[120px] tablet:min-h-[140px] sl:min-h-[150px] rounded-xl",
    contentAlignment: "center",
    colors: {
      titleColor: "text-white",
      subtitleColor: "text-gray-600",
      background: "bg-[#A28D71]",
    },
    typography: {
      titleSize: "text-lg sm:text-2xl",
      titleWeight: "font-medium",
      subtitleSize: "text-xs sm:text-sm",
      subtitleWeight: "font-semibold",
      subtitleLeading: "leading-relaxed",
      subtitleTracking: "tracking-normal",
    },
    button: {
      label: "بافتی ها ",
      href: "/shop/category",
      className: "text-white text-sm font-normal rounded-lg",
      showArrow: true,
    },
  })
  // Bottom right action banner
  .bottomActionBannerRight({
    title: "دامن ها",
    subtitle: "",
    image: {
      src: "/images/HeroSlider/ActionBannerLeft/Slide2.webp",
      alt: "Category Banner",
      width: 800,
      height: 900,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg scale-125 -translate-y-4 pl-5 object-contain",
      objectPosition: "left",
    },
    className: "min-h-[120px] tablet:min-h-[140px] sl:min-h-[150px]  rounded-xl",
    contentAlignment: "bottom",
    colors: {
      titleColor: "text-white",
      subtitleColor: "text-gray-600",
      background: "bg-[#374C5F]",
    },
    typography: {
      titleSize: "text-lg sm:text-2xl",
      titleWeight: "font-medium",
      subtitleSize: "text-xs sm:text-sm",
      subtitleWeight: "font-semibold",
      subtitleLeading: "leading-relaxed",
      subtitleTracking: "tracking-normal",
    },
    button: {
      label: "دامن های پاییزه ",
      href: "/shop/category",
      className: "text-white text-sm font-normal rounded-lg",
      showArrow: true,
    },
  })
  .withPriority()
  .build();
