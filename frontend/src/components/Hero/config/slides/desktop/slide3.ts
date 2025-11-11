/**
 * Desktop Slide 3
 * Text banner with blue theme + side image + two bottom action banners
 */
import { DesktopSlideBuilder } from "../../slideFactory";

export const slide3 = new DesktopSlideBuilder()
  // Top left text banner with blue theme and custom typography
  .topLeftTextBanner({
    title: "لباس‌های پریمیوم، با قیمت‌های باورنکردنی!",
    subtitle: "انــــــفجار تخفیــــف‌ پوشــــــاک",
    className: "w-full gap-[8px] pb-8 mb-[10px] rounded-3xl px-[36px] pt-[30px]",
    titleClassName: "font-rokh font-bold ",
    subtitleClassName: "font-kaghaz font-semibold",
    colors: {
      background: "bg-slate-50",
      titleColor: "text-gray-400",
      subtitleColor: "text-[#C79769]",
    },
    typography: {
      titleSize: "lg:text-[26px] 2xl:text-[30pxpx]",
      subtitleSize: "lg:text-[60px] 2xl:text-[70px]",
      titleWeight: "font-bold",
      subtitleWeight: "font-semibold",
      titleLeading: "leading-relaxed",
      subtitleLeading: "leading-relaxed",
      titleTracking: "tracking-tight",
    },
  })
  // Bottom right action banner
  .bottomActionBannerRight({
    title: "دامن ها",
    subtitle: "",
    className: "h-[80%] bottom",

    colors: {
      background: "bg-[#E3BDC9]",
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
      src: "/images/HeroSlider/ActionBannerRight/Slide3.webp",
      alt: "Category Banner",
      width: 700,
      height: 700,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg pl-4 -translate-y-2 scale-110 object-contain",
      objectPosition: " left",
    },
    background: {
      type: "color",
      value: "#E3BDC9",
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
    title: "دامن ها",
    subtitle: "",
    className: "h-[80%] bottom",

    colors: {
      background: "bg-[#E3BDC9]",
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
      src: "/images/HeroSlider/ActionBannerLeft/Slide3.webp",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg pl-4 scale-110 object-contain",
      objectPosition: " left",
    },
    background: {
      type: "color",
      value: "#E3BDC9",
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
  // Right banner with background and foreground image
  .rightBanner({
    background: {
      type: "image",
      value: "/images/HeroSlider/Square/Slide3Background.png",
      alt: "Background",
      width: "520px",
      height: "427px",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-3xl",
    },
    foregroundImage: {
      src: "/images/HeroSlider/Square/Slide3Foreground.png",
      alt: "Hero Side Image",
      width: 1000,
      height: 1000,
      priority: false,
      objectPosition: "bottom right",
      className: "object-contain  translate-x-4 xl:-translate-x-6",
    },
  })
  .build();
