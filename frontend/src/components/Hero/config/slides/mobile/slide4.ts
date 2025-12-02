/**
 * Mobile Slide 1
 * Advanced hero square + premium text banner + action banners
 */
import { MobileSlideBuilder } from "../../slideFactory";

export const slide4 = new MobileSlideBuilder()
  // Hero banner (square with background + foreground)
  .primaryBanner({
    title: "لباســـی که خودت را توش پیدا می‌کنی",
    subtitle: "جزئیات کوچک، تأثیر بزرگ.",
    className: "w-full gap-[8px] rounded-3xl px-[24px] pb-[24px] pt-[20px]",
    colors: {
      background: "bg-slate-50",
      titleColor: "text-[#94B5D2]",
      subtitleColor: "text-gray-600",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "text-[26px] ",
      titleWeight: "font-bold",
      titleTracking: "tracking-tight",
      subtitleSize: "text-lg",
      subtitleWeight: "font-semibold",
      titleLeading: "leading-tight",
      subtitleLeading: "leading-relaxed",
    },
  })
  .heroBanner({
    background: {
      type: "image",
      value: "/images/HeroSlider/Square/Desktop1Background.png",
      alt: "Background",
      width: "100%",
      height: "80%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-lg",
    },
    foregroundImage: {
      src: "/images/HeroSlider/Square/Desktop1Foreground.webp",
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
    title: "دامن ها",
    subtitle: "",
    image: {
      src: "/images/HeroSlider/ActionBannerLeft/Slide1.webp",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg mb-2 scale-150 -translate-y-4 object-contain",
      objectPosition: "bottom left",
    },
    className: "rounded-lg",
    colors: {
      titleColor: "text-white",
      subtitleColor: "text-gray-600",
      background: "bg-[#CFB99C]",
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
  // Bottom right action banner
  .bottomActionBannerRight({
    title: "دامن ها",
    subtitle: "",
    image: {
      src: "/images/HeroSlider/ActionBannerRight/Slide1.webp",
      alt: "Category Banner",
      width: 800,
      height: 900,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg scale-125 pl-2 object-contain",
      objectPosition: "left",
    },
    className: "rounded-lg",
    colors: {
      titleColor: "text-white",
      subtitleColor: "text-gray-600",
      background: "bg-[#A6C2DB]",
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
