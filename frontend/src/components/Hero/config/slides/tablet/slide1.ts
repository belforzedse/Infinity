/**
 * Tablet Slide 1
 * Premium layout with hero square + styled text banner + rich action banners
 */
import { TabletSlideBuilder } from "../../slideFactory";

export const slide1 = new TabletSlideBuilder()
  // Hero banner (square with background + foreground)
  .heroBanner({
    background: {
      type: "image",
      value: "/images/HeroSlider/Square/Desktop1Background.png",
      width: "100%",
      height: "100%",
      position: "center",
      backgroundSize: "cover",
      className: "rounded-lg",
    },
    foregroundImage: {
      src: "/images/HeroSlider/Square/Desktop1Foreground.webp",
      alt: "Hero",
      width: 650,
      height: 650,
      priority: true,
      loading: "eager",
      className: "object-contain",
    },
  })
  // Primary text banner
  .primaryBanner({
    title: "لباســـی که خودت را توش پیدا می‌کنی",
    subtitle: "جزئیات کوچک، تأثیر بزرگ.",
    className: "w-full gap-[8px] rounded-3xl px-[32px] pb-[32px] pt-[28px]",
    colors: {
      background: "bg-slate-50",
      titleColor: "text-[#94B5D2]",
      subtitleColor: "text-gray-600",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "lg:text-[40px] 2xl:text-[48px]",
      titleWeight: "font-bold",
      titleTracking: "tracking-tight",
      subtitleSize: "lg:text-[24px] 2xl:text-[28px]",
      subtitleWeight: "font-semibold",
      titleLeading: "leading-tight",
      subtitleLeading: "leading-relaxed",
    },
  })
  // Bottom left action banner
  .bottomActionBannerLeft({
    title: "تراکم رنگ",
    subtitle: "برترین انتخاب",
    image: {
      src: "/images/bottomright2.png",
      alt: "Category",
      width: 600,
      height: 600,
      className: "h-full w-full rounded-lg object-cover",
    },
    className: "rounded-lg",
    colors: {
      background: "bg-gradient-to-b from-red-700/70 to-red-600/60",
      titleColor: "text-red-50",
      subtitleColor: "text-red-100",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "text-2xl sm:text-3xl",
      titleWeight: "font-bold",
      subtitleSize: "text-sm sm:text-base",
      subtitleWeight: "font-medium",
      titleLeading: "leading-tight",
      subtitleLeading: "leading-relaxed",
    },
    button: {
      label: "خریدی",
      href: "#",
      className: "text-red-50 text-base font-semibold",
      showArrow: true,
    },
  })
  // Bottom right action banner
  .bottomActionBannerRight({
    title: "دختر ها",
    subtitle: "مد کودک",
    image: {
      src: "/images/bottomleft2.png",
      alt: "Category",
      width: 600,
      height: 600,
      className: "h-full w-full rounded-lg object-cover",
    },
    className: "rounded-lg",
    colors: {
      background: "bg-gradient-to-t from-pink-700/70 to-rose-600/60",
      titleColor: "text-pink-50",
      subtitleColor: "text-rose-100",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "text-2xl sm:text-3xl",
      titleWeight: "font-bold",
      subtitleSize: "text-sm sm:text-base",
      subtitleWeight: "font-medium",
      titleLeading: "leading-tight",
      subtitleLeading: "leading-relaxed",
    },
    button: {
      label: "نگاه",
      href: "#",
      className: "text-pink-50 text-base font-semibold",
      showArrow: true,
    },
  })
  .withPriority()
  .build();
