import { MobileLayout } from "../types";

const baseMobile: MobileLayout = {
  heroDesktop: {
    src: "/images/index-img1-desktop.png",
    alt: "Hero Banner",
    width: 1920,
    height: 560,
    className: "w-full rounded-lg object-cover",
    sizes: "100vw",
    priority: true,
  },
  heroMobile: {
    src: "/images/index-img1-mobile.png",
    alt: "Hero Banner Mobile",
    width: 750,
    height: 520,
    className: "w-full rounded-lg",
    sizes: "100vw",
    priority: true,
  },
  secondaryPrimary: {
    src: "/images/index-img2-mobile.png",
    alt: "Banner",
    width: 1200,
    height: 600,
    className: "h-full w-full rounded-b-[10px] rounded-t-[10px] object-cover",
    loading: "lazy",
    sizes: "(max-width: 768px) 100vw, 50vw",
    href: "/plp?category=shirt",
  },
  secondaryTop: {
    src: "/images/index-img3-desktop.png",
    alt: "Banner",
    width: 600,
    height: 600,
    className: "h-full w-full rounded-lg object-cover",
    loading: "lazy",
    sizes: "(max-width: 768px) 50vw, 50vw",
    href: "/plp?category=%d9%be%d9%84%db%8c%d9%88%d8%b1-%d9%88-%d8%a8%d8%a7%d9%81%d8%aa",
  },
  secondaryBottom: {
    src: "/images/index-img4-desktop.png",
    alt: "Banner",
    width: 600,
    height: 600,
    className: "h-full w-full rounded-lg object-cover",
    loading: "lazy",
    sizes: "(max-width: 768px) 50vw, 50vw",
    href: "/plp?category=skirt",
  },
};

export const mobileSlides: MobileLayout[] = [
  baseMobile,
  baseMobile,
  baseMobile,
  baseMobile,
  baseMobile,
];
