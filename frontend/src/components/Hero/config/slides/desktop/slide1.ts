import { DesktopSlideBuilder } from "../../slideFactory";

export const slide1 = new DesktopSlideBuilder()
  .textBanner({
    title: "لباس‌هایی از قلــــــب پینترست...",
    subtitle: "برای خاص پسندها",
    className: "w-full gap-[8px] rounded-3xl px-[36px] pb-[70px] mb-[20px] pt-[30px]",
  })
  .colors({
    background: "bg-stone-50",
    titleColor: "text-red-900",
    subtitleColor: "text-gray-600",
  })
  .belowLeft({
    src: "/images/index-img3-desktop.png",
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
    className: "h-full w-full rounded-lg object-contain",
  })
  .belowRight({
    src: "/images/index-img4-desktop.png",
    href: "https://infinitycolor.co/shop/skirt/",
    className: "h-full w-full rounded-lg object-contain",
  })
  .side({
    src: "/images/index-img2-desktop.png",
    href: "#",
    sizes: "(min-width: 1024px) 42vw, 100vw",
  })
  .withPriority() // First slide gets priority for LCP
  .build();
