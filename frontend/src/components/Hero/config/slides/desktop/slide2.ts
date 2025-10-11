import { DesktopSlideBuilder } from "../../slideFactory";

export const slide2 = new DesktopSlideBuilder()
  .textBanner({
    title: "بزار استـــــــــایـــــــلت حرف بزنه",
    subtitle: "پوشاک کاربردی، طراحی هوشمند",
    className: "w-full gap-[8px]  pb-[50px] mb-[10px] rounded-3xl px-[36px] pb-3 pt-[30px]",
  })
  .colors({
    background: "bg-slate-50",
    titleColor: "text-[#A28471]",
    subtitleColor: "text-gray-600",
  })
  .typography({
    titleSize: "lg:text-[48px] 2xl:text-[55px]",
    subtitleSize: "lg:text-[28px] 2xl:text-[32px]",
    titleWeight: "font-extrabold",
    subtitleWeight: "font-semibold",
    titleLeading: "leading-12",
    subtitleLeading: "leading-relaxed",
    titleTracking: "tracking-tight",
  })
  .belowLeft({
    src: "/images/bottomright2.png",
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
    className: "h-full w-full rounded-lg object-contain",
  })
  .belowRight({
    src: "/images/bottomleft2.png",
    href: "https://infinitycolor.co/shop/skirt/",
    className: "h-full w-full rounded-lg object-contain",
  })
  .side({
    src: "/images/side2.png",
    href: "#",
  })
  .appendClassName("side", "contrast-[1.02]")
  .build();
