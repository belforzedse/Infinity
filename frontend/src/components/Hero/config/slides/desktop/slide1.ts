/**
 * Desktop Slide 3
 * Text banner with blue theme + side image + two bottom action banners
 */
import { DesktopSlideBuilder } from "../../slideFactory";

export const slide1 = new DesktopSlideBuilder()
  // Top left text banner with blue theme and custom typography
  .topLeftTextBanner({
    title: "نیوکالکشن اینفینیتی جلوتر از مد  ",
    subtitle: "این بار فراتر از مـــد باش ",
    className: "w-full gap-[8px] pb-[40x] rounded-3xl px-[36px] pt-[30px]",
    colors: {
      background: "",
      titleColor: "text-[#9E8578]",
      subtitleColor: "text-[#DAC9BA]",
    },
    typography: {
      titleFont: "font-rokh",           // Font family for title
      subtitleFont: "font-kaghaz",          // Font family for subtitle
      titleSize: "lg:text-[26px] 2xl:text-[30px]",
      subtitleSize: "lg:text-[48px] 2xl:text-[80px] ",
      titleWeight: "font-bold",
      subtitleWeight: "font-semibold",
      titleLeading: "leading-tight",
      subtitleLeading: "leading-relaxed",
      titleTracking: "tracking-tight",
    },
  })
  // Bottom right action banner
  .bottomActionBannerRight({
    title: "دامن ها",
    subtitle: "",
    className: "h-[80%]",
    colors: {
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
      src: "/images/HeroSlider/ActionBannerRight/Slide1.webp",
      alt: "Category Banner",
      width: 400,
      height: 500,
      sizes: "(max-width: 1280px) 25vw, 400px",
      href: "/plp",
      className: "h-full w-full rounded-lg pl-2 object-contain",
      objectPosition: "left",
    },
    background: {
      type: "color",
      value: "#A6C2DB",
      alt: "Background",
      width: "100%",
      height: "80%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-3xl",
    },
    button: {
      label: "دامن های پاییزه ",
      href: "/plp",
      className: "text-white text-[20px] font-normal rounded-lg",
      showArrow: true,
    },
  })
  // Bottom left action banner (image only, with brightness effect)
  .bottomActionBannerLeft({
    title: "پلیور ها",
    subtitle: "",
    className: "h-[80%]",
    colors: {
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
      src: "/images/HeroSlider/ActionBannerLeft/Slide1.webp",
      alt: "Category Banner",
      width: 400,
      height: 500,
      sizes: "(max-width: 1280px) 25vw, 400px",
      href: "/plp",
      className: "h-full w-full rounded-lg mb-2 -translate-y-4 object-contain",
      objectPosition: "top left ",
    },
    background: {
      type: "color",
      value: "#CFB99C",
      alt: "Background",
      width: "100%",
      height: "80%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-3xl",
    },
    button: {
      label: "بافت ها",
      href: "/plp",
      className: "text-white text-[20px] font-normal rounded-lg",
      showArrow: true,
    },
  })
  // Right banner with background and foreground image
  .rightBanner({
    background: {
      type: "image",
      value: "/images/HeroSlider/Square/Desktop1Background.webp",
      alt: "Background",
      width: "520px",
      height: "530px",
      position: "bottom",
      backgroundSize: "contain",
      className: "rounded-3xl",
    },
    foregroundImage: {
      src: "",
      alt: "Hero Side Image",
      width: 565,
      height: 565,
      sizes: "(max-width: 1280px) 50vw, 565px",
      priority: false,
    },
  })
  .build();
