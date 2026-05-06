/**
 * Mobile Slide 1
 * Advanced hero square + premium text banner + action banners
 */
import { MobileSlideBuilder } from "../../slideFactory";

export const slide2 = new MobileSlideBuilder()
  // Hero banner (square with background + foreground)
  .primaryBanner({
    title: "بزار استـــــــــایـــــــلت حرف بزنه",
    subtitle: "پوشاک کاربردی، طراحی هوشمند.",
    className: "w-full gap-[8px] rounded-3xl px-[24px] pb-[24px] pt-[20px]",
    colors: {
      background: "bg-slate-50",
      titleColor: "text-[#A28471]",
      subtitleColor: "text-gray-600",
    },
    typography: {
      titleFont: "font-kaghaz",
      titleSize: "text-[30px] ",
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
      sizes: "100vw",
      priority: true,
      loading: "eager",
      className: "object-contain w-[99%] scale-125 h-[99%] translate-y-8",
      objectPosition: "bottom center",
    },
  })
  // Bottom left action banner
  .bottomActionBannerLeft({
    title: "پلیورها ",
    subtitle: "",
    image: {
      src: "/images/HeroSlider/ActionBannerRight/Slide2.webp",
      alt: "Category Banner",
      width: 400,
      height: 500,
      sizes: "(max-width: 768px) 50vw, 350px",
      href: "/plp",
      className: "h-full w-full rounded-lg mb-2 scale-125 -translate-y-6 object-contain",
      objectPosition: "bottom left",
    },
    className: "rounded-lg",
    paddingClassName: "px-3 py-4 pr-3",
    background: {
      type: "color",
      value: "#A28D71",
      width: "100%",
      height: "100%",
      position: "center",
      backgroundSize: "cover",
      className: "rounded-lg",
    },
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
      label: "بافتنی ها",
      href: "/plp",
      className: "text-white text-sm font-normal rounded-lg",
      showArrow: true,
    },
  })
  // Bottom right action banner
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
      className: "h-full w-full rounded-lg scale-110 -translate-y-2 pl-2 object-contain",
      objectPosition: "left",
    },
    className: "rounded-lg ",
    paddingClassName: "px-3 py-4 pr-3",
    background: {
      type: "color",
      value: "#374C5F",
      width: "100%",
      height: "100%",
      position: "center",
      backgroundSize: "cover",
      className: "rounded-lg",
    },
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
      label: "مانتو",
      href: "/plp",
      className: "text-white text-sm font-normal rounded-lg",
      showArrow: true,
    },
  })
  .withPriority()
  .build();
