/**
 * Mobile Slide 5
 * Vibrant warm colors with premium presentation
 */
import { MobileSlideBuilder } from "../../slideFactory";

export const slide5 = new MobileSlideBuilder()
  .heroBanner({
    background: { type: "color", value: "bg-orange-100" },
    foregroundImage: {
      src: "/images/side3.png",
      alt: "Hero",
      width: 600,
      height: 600,
      className: "object-contain",
    },
  })
  .primaryBanner({
    title: "تابستان داغ",
    subtitle: "کالکشن سال",
    className: "w-full gap-[8px] rounded-3xl px-[24px] pb-[24px] pt-[20px]",
    colors: {
      background: "bg-orange-50",
      titleColor: "text-orange-900",
      subtitleColor: "text-orange-700",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "text-xl sm:text-2xl md:text-3xl",
      titleWeight: "font-bold",
      subtitleSize: "text-sm sm:text-base md:text-lg",
      subtitleWeight: "font-medium",
      titleLeading: "leading-tight",
      subtitleLeading: "leading-relaxed",
    },
  })
  .bottomActionBannerLeft({
    title: "تابستان",
    image: {
      src: "/images/bottomleft3.png",
      alt: "Banner",
      width: 600,
      height: 600,
      className: "h-full w-full rounded-lg object-contain md:object-cover",
    },
    className: "rounded-lg",
    colors: {
      background: "bg-gradient-to-b from-orange-700/70 to-red-600/50",
      titleColor: "text-orange-50",
      subtitleColor: "text-yellow-100",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "text-lg sm:text-2xl",
      titleWeight: "font-bold",
    },
    button: {
      label: "نگاه کنید",
      href: "#",
      className: "text-orange-50 text-xs font-semibold",
      showArrow: true,
    },
  })
  .bottomActionBannerRight({
    title: "رنگ نئون",
    image: {
      src: "/images/bottomright3.png",
      alt: "Banner",
      width: 600,
      height: 600,
      className: "h-full w-full rounded-lg object-contain md:object-cover",
    },
    className: "rounded-lg",
    colors: {
      background: "bg-gradient-to-t from-indigo-900/70 to-purple-600/50",
      titleColor: "text-indigo-100",
      subtitleColor: "text-purple-200",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "text-lg sm:text-2xl",
      titleWeight: "font-bold",
    },
    button: {
      label: "کاوش",
      href: "#",
      className: "text-indigo-100 text-xs font-semibold",
      showArrow: true,
    },
  })
  .build();
