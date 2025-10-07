import { DesktopSlideBuilder } from "../../slideFactory";

export const slide3 = new DesktopSlideBuilder()
  .textBanner({
    title: "لباســـی که خودت را توش پیدا می‌کنی",
    subtitle: "جزئیات کوچک، تأثیر بزرگ.",
    className: "w-full gap-[8px] rounded-3xl px-[36px] pb-3 pt-[30px]",
  })
  .colors({
    background: "bg-slate-50",
    titleColor: "text-[#94B5D2]",
    subtitleColor: "text-gray-600",
  })
  .typography({
    titleSize: "lg:text-[48px] 2xl:text-[50px]",
    subtitleSize: "lg:text-[26px] 2xl:text-[30px]",
    titleWeight: "font-bold",
    subtitleWeight: "font-semibold",
    titleLeading: "leading-tight",
    subtitleLeading: "leading-relaxed",
    titleTracking: "tracking-tight",
  })
  .belowLeft({
    src: "/images/bottomleft3.png",
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
    className: "h-full w-full rounded-lg object-contain",
  })
  .belowRight({
    src: "/images/bottomright3.png",
    href: "https://infinitycolor.co/shop/skirt/",
    className: "h-full w-full rounded-lg object-contain",
  })
  .side({
    src: "/images/side3.png",
    href: "#",
  })
  .appendClassName("belowRight", "brightness-105")
  .build();
