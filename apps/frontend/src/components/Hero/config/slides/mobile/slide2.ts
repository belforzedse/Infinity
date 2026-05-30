/**
 * Mobile Slide 2 — Figma-ratio layout (headline, main visual, compact cards)
 */
import { MobileSlideBuilder } from "../../slideFactory";

export const slide2 = new MobileSlideBuilder()
  .primaryBanner({
    title: "بزار استـــــــــایـــــــلت حرف بزنه",
    subtitle: "پوشاک کاربردی، طراحی هوشمند.",
    className: "w-full gap-2 rounded-3xl px-4 pb-4 pt-5",
    colors: {
      background: "bg-stone-50",
      titleColor: "text-[#A28471]",
      subtitleColor: "text-gray-600",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "text-2xl",
      titleWeight: "font-bold",
      titleTracking: "tracking-tight",
      subtitleSize: "text-base",
      subtitleWeight: "font-normal",
      titleLeading: "leading-tight",
      subtitleLeading: "leading-relaxed",
    },
  })
  .heroBanner({
    background: {
      type: "image",
      value: "/images/HeroSlider/Square/Slide2Background.png",
      alt: "Background",
      width: "100%",
      height: "100%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-[20px]",
    },
    foregroundImage: {
      src: "/images/HeroSlider/Square/Slide2Foreground.png",
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
      src: "/images/HeroSlider/ActionBannerRight/Slide2.webp",
      alt: "Category Banner",
      width: 400,
      height: 500,
      sizes: "(max-width: 768px) 50vw, 350px",
      href: "/plp",
      className: "object-contain object-left-bottom",
      objectPosition: "left bottom",
    },
    className: "h-full rounded-[20px]",
    paddingClassName: "px-3 py-3 pl-2",
    contentAlignment: "center",
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
    title: "کت ها",
    subtitle: "",
    image: {
      src: "/images/HeroSlider/ActionBannerLeft/Slide2.webp",
      alt: "Category Banner",
      width: 400,
      height: 500,
      sizes: "(max-width: 768px) 50vw, 350px",
      href: "/plp",
      className: "object-contain object-left-bottom",
      objectPosition: "left bottom",
    },
    className: "h-full rounded-[20px]",
    paddingClassName: "px-3 py-3 pl-2",
    contentAlignment: "center",
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
