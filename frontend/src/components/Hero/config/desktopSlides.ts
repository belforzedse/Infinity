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
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
  },
  belowRight: {
    src: "/images/index-img4-desktop.png",
    alt: "Banner",
    width: 600,
    height: 600,
    className: "translate-y-[7px]",
    loading: "lazy",
    href: "https://infinitycolor.co/shop/skirt/",
  },
  side: {
    src: "/images/index-img2-desktop.png",
    alt: "Hero Side Banner",
    width: 700,
    height: 700,
    className: "object-fit h-full rounded-lg",
    href: "#",
  },
};

// Clone helper to avoid shared references and allow per-slide tweaks
const clone = (d: DesktopLayout): DesktopLayout => ({
  textBanner: { ...d.textBanner },
  belowLeft: { ...d.belowLeft },
  belowRight: { ...d.belowRight },
  side: { ...d.side },
});

const slide1 = clone(baseLayout);
// Improve LCP on first slide
slide1.side.priority = true;
slide1.side.loading = "eager";
slide1.side.sizes = "(min-width: 1024px) 42vw, 100vw";

const slide2 = clone(baseLayout);
slide2.side.className = `${slide2.side.className} contrast-[1.02]`;

const slide3 = clone(baseLayout);
slide3.belowRight.className = `${slide3.belowRight.className} brightness-105`;

export const desktopSlides: DesktopLayout[] = [slide1, slide2, slide3];
