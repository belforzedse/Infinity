/**
 * Tablet Slide 1 — Figma-ratio layout with compact category cards
 */
import { TabletSlideBuilder } from "../../slideFactory";

export const slide1 = new TabletSlideBuilder()
  .primaryBanner({
    title: "لباســـی که خودت را توش پیدا می‌کنی",
    subtitle: "جزئیات کوچک، تأثیر بزرگ.",
    className: "w-full gap-[8px] rounded-3xl px-[24px] pb-[40px] pt-[20px]",
    colors: {
      background: "bg-slate-50",
      titleColor: "text-[#94B5D2]",
      subtitleColor: "text-gray-600",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "sl:text-[65px] text-[40px] ",
      titleWeight: "font-bold",
      titleTracking: "tracking-tight",
      subtitleSize: "sl:text-[40px] text-xl",
      subtitleWeight: "font-semibold",
      titleLeading: "leading-relaxed",
      subtitleLeading: "leading-relaxed",
    },
  })
  .heroBanner({
    background: {
      type: "image",
      value: "/images/HeroSlider/Square/Desktop1Background.webp",
      alt: "Background",
      width: "100%",
      height: "100%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-[20px]",
    },
    foregroundImage: {
      src: "/images/HeroSlider/Square/Desktop1Foreground.webp",
      alt: "Hero Banner",
      width: 600,
      height: 600,
      sizes: "100vw",
      priority: true,
      loading: "eager",
      className: "object-contain object-bottom h-full w-full max-h-full max-w-full",
      objectPosition: "bottom center",
    },
  })
  .bottomActionBannerLeft({
    title: "پلیورها",
    subtitle: "",
    image: {
      src: "/images/HeroSlider/ActionBannerLeft/Slide1.webp",
      alt: "Category Banner",
      width: 400,
      height: 500,
      sizes: "(max-width: 768px) 50vw, 350px",
      href: "/plp",
      className: "object-contain object-left-bottom",
      objectPosition: "left bottom",
    },
    className: "h-full rounded-[20px]",
    contentAlignment: "center",
    paddingClassName: "px-3 py-3 pl-2",
    background: {
      type: "color",
      value: "#FFFBEB",
      width: "100%",
      height: "78%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-[20px]",
    },
    colors: {
      titleColor: "text-neutral-800",
      subtitleColor: "text-gray-600",
      background: "bg-amber-50",
    },
    typography: {
      titleSize: "text-lg",
      titleWeight: "font-normal",
    },
    button: {
      label: "",
      href: "/plp",
      className: "text-neutral-800 text-lg font-normal",
      showArrow: true,
    },
  })
  .bottomActionBannerRight({
    title: "دامن ها",
    subtitle: "",
    image: {
      src: "/images/HeroSlider/ActionBannerRight/Slide1.webp",
      alt: "Category Banner",
      width: 400,
      height: 500,
      sizes: "(max-width: 768px) 50vw, 350px",
      href: "/plp",
      className: "object-contain object-left-bottom",
      objectPosition: "left bottom",
    },
    className: "h-full rounded-[20px]",
    contentAlignment: "center",
    paddingClassName: "px-3 py-3 pl-2",
    background: {
      type: "color",
      value: "#ECFDF5",
      width: "100%",
      height: "78%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-[20px]",
    },
    colors: {
      titleColor: "text-neutral-800",
      subtitleColor: "text-gray-600",
      background: "bg-emerald-50",
    },
    typography: {
      titleSize: "text-lg",
      titleWeight: "font-normal",
    },
    button: {
      label: "",
      href: "/plp",
      className: "text-neutral-800 text-lg font-normal",
      showArrow: true,
    },
  })
  .withPriority()
  .build();
