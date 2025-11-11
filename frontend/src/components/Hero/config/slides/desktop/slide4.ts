/**
 * Desktop Slide 3
 * Text banner with blue theme + side image + two bottom action banners
 */
import { DesktopSlideBuilder } from "../../slideFactory";

export const slide4 = new DesktopSlideBuilder()
  // Top left text banner with blue theme and custom typography
  .topLeftTextBanner({
    title: "لباس‌های پریمیوم، با قیمت‌های باورنکردنی!",
    subtitle: "بلــــــــک فرایدی شروع شــــــــد!",
    className: "w-full gap-[4px] pb-8 mb-[10px] rounded-3xl px-[36px] pt-[30px]",
    titleClassName: "font-peyda font-bold ",
    subtitleClassName: "font-kaghaz font-semibold",
    colors: {
      background: "bg-slate-50",
      titleColor: "text-[#53453E]",
      subtitleColor: "text-[#53453E]",
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
    className: "h-[80%]",
    colors: {
      titleColor: "text-[#53453E]",
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
      src: "/images/HeroSlider/ActionBannerLeft/Slide4.webp",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg  object-contain",
      objectPosition: "left",
    },
    background: {
      type: "color",
      value: "#F6EBF3",
      alt: "Background",
      width: "100%",
      height: "80%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-3xl",
    },
    button: {
      label: "دامن های پاییزه ",
      href: "/shop/category",
      className: "text-[#53453E] text-[20px] font-normal rounded-lg",
      showArrow: true,
    },
  })
  // Bottom left action banner (image only, with brightness effect)
  .bottomActionBannerLeft({
    title: "دامن ها",
    subtitle: "",
    className: "h-[80%]",
    colors: {
      titleColor: "text-[#53453E]",
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
      src: "/images/HeroSlider/ActionBannerRight/Slide4.webp",
      alt: "Category Banner",
      width: 600,
      height: 600,
      href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
      className: "h-full w-full rounded-lg -translate-x-2 scale-125 translate-y-2  object-contain",
      objectPosition: "left",
    },
    background: {
      type: "color",
      value: "#F6EBF3",
      alt: "Background",
      width: "100%",
      height: "80%",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-3xl",
    },
    button: {
      label: "دامن های پاییزه ",
      href: "/shop/category",
      className: "text-[#53453E] text-[20px] font-normal rounded-lg",
      showArrow: true,
    },
  })
  // Right banner with background and foreground image
  .rightBanner({
    background: {
      type: "image",
      value: "/images/HeroSlider/Square/Slide4Background.png",
      alt: "Background",
      width: "520px",
      height: "427px",
      position: "bottom center",
      backgroundSize: "cover",
      className: "rounded-3xl",
    },
    foregroundImage: {
      src: "/images/HeroSlider/Square/Slide4Foreground.png",
      alt: "Hero Side Image",
      width: 650,
      height: 650,
      priority: false,
      objectPosition: "bottom center",
    },
  })
  .build();
