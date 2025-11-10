/**
 * Desktop Slide 3
 * Text banner with blue theme + side image + two bottom action banners
 */
import { DesktopSlideBuilder } from "../../slideFactory";

export const slide2 = new DesktopSlideBuilder()
  // Top left text banner with blue theme and custom typography
  .topLeftTextBanner({
    title: "بزار استـــــــــایـــــــلت حرف بزنه",
    subtitle: "پوشاک کاربردی، طراحی هوشمند.",
    className: "w-full gap-[8px] pb-[60px] mb-[10px] rounded-3xl pr-[36px] pt-[30px]",
    colors: {
      background: "bg-slate-50",
      titleColor: "text-[#A28471]",
      subtitleColor: "text-gray-600",
    },
    typography: {
      titleSize: "lg:text-[50px] 2xl:text-[62px]",
      subtitleSize: "lg:text-[26px] 2xl:text-[30px]",
      titleWeight: "font-bold",
      subtitleWeight: "font-semibold",
      titleLeading: "leading-tight",
      subtitleLeading: "leading-relaxed",
      titleTracking: "tracking-tight",
    },
  })
  // Bottom right action banner
  .bottomActionBannerRight({
    title: " کت ها",
    subtitle: "",
    colors: {
      background: "bg-[#374C5F]",
      titleColor: "text-white",
      subtitleColor: "text-gray-600",
    },

    typography: {
      titleSize: "text-[30px]", // Font size
      titleWeight: "font-medium", // Font weight
      // Letter spacing
      subtitleSize: "text-sm",
      subtitleWeight: "font-semibold",
      subtitleLeading: "leading-relaxed",
      subtitleTracking: "tracking-normal",
    },
    image: {
      src: "/images/HeroSlider/ActionBannerLeft/Slide2.webp",
      alt: "Category Banner",
      width: 400,
      height: 400,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-auto w-auto rounded-lg pl-8 pb-4 object-contain",
      objectPosition: " left",
    },
    background: {
      type: "color",
      value: "#374C5F",
      alt: "Background",
      width: "",
      height: "165px",
      position: "bottom center", // center, bottom center, top left, etc.
      backgroundSize: "cover",
      className: "rounded-3xl",
    },
    button: {
      label: "دامن های پاییزه ",
      href: "/shop/category",
      className: "text-white text-[20px] font-normal rounded-lg",
      showArrow: true,
    },
  })
  // Bottom left action banner (image only, with brightness effect)
  .bottomActionBannerLeft({
    title: "پلیورها ",
    subtitle: "",
    colors: {
      background: "bg-[#A28D71]",
      titleColor: "text-white",
      subtitleColor: "text-gray-600",
    },

    typography: {
      titleSize: "text-[30px]", // Font size
      titleWeight: "font-medium", // Font weight
      // Letter spacing
      subtitleSize: "text-sm",
      subtitleWeight: "font-semibold",
      subtitleLeading: "leading-relaxed",
      subtitleTracking: "tracking-normal",
    },
    image: {
      src: "/images/HeroSlider/ActionBannerRight/Slide2.webp",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg pl-4 pb-8 object-contain",
      objectPosition: "top left",
    },
    background: {
      type: "color",
      value: "#A28D71",
      alt: "Background",
      width: "",
      height: "165px",
      position: "bottom center", // center, bottom center, top left, etc.
      backgroundSize: "cover",
      className: "rounded-3xl",
    },
    button: {
      label: "بافتنی ها",
      href: "/shop/category",
      className: "text-white text-[20px] font-normal rounded-lg",
      showArrow: true,
    },
  })
  // Right banner with background and foreground image
  .rightBanner({
    background: {
      type: "image",
      value: "/images/HeroSlider/Square/Slide2Background.png",
      alt: "Background",
      width: "520px",
      height: "427px",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-3xl",
    },
    foregroundImage: {
      src: "/images/HeroSlider/Square/Slide2Foreground.png",
      alt: "Hero Side Image",
      width: 650,
      height: 650,
      priority: false,
 // "center", "bottom center", "top left", etc.
    },
  })
  .build();
