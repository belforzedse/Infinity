import { DesktopLayout } from "../types";

const baseTextBanner = {
  title: "لباس‌هایی از قلــــــب پینترست...",
  subtitle: "برای خاص پسندها",
  className:
    "h-[200px] w-full gap-[8px] rounded-3xl bg-stone-50 px-[36px] pb-[36px] pt-[30px]",
  titleClassName: "text-[54px] font-bold leading-[150%] text-red-900",
  subtitleClassName: "leading[110%] text-[34px] font-medium text-gray-600",
};

const baseLayout: DesktopLayout = {
  textBanner: baseTextBanner,
  belowLeft: {
    src: "/images/index-img3-desktop.png",
    alt: "Banner",
    width: 600,
    height: 600,
    className: "h-full w-full translate-y-[-2px] rounded-lg object-cover",
    loading: "lazy",
  },
  belowRight: {
    src: "/images/index-img4-desktop.png",
    alt: "Banner",
    width: 600,
    height: 600,
    className: "translate-y-[7px]",
    loading: "lazy",
  },
  side: {
    src: "/images/index-img2-desktop.png",
    alt: "Hero Side Banner",
    width: 700,
    height: 700,
    className: "object-fit h-full rounded-lg",
  },
};

export const desktopSlides: DesktopLayout[] = [
  baseLayout,
  baseLayout,
  baseLayout,
];

