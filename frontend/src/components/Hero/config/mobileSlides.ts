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

// Avoid shared references and add light per-slide polish
const clone = (m: MobileLayout): MobileLayout => ({
  heroDesktop: { ...m.heroDesktop },
  heroMobile: { ...m.heroMobile },
  secondaryPrimary: { ...m.secondaryPrimary },
  secondaryTop: { ...m.secondaryTop },
  secondaryBottom: { ...m.secondaryBottom },
});

const m1 = clone(baseMobile);
// Better LCP on first image in mobile
m1.heroMobile.priority = true;
m1.heroDesktop.priority = true;

const m2 = clone(baseMobile);
// Subtle visual variety
m2.secondaryTop.className = `${m2.secondaryTop.className} brightness-105`;

const m3 = clone(baseMobile);
m3.secondaryPrimary.className = `${m3.secondaryPrimary.className} contrast-[1.03]`;

export const mobileSlides: MobileLayout[] = [m1, m2, m3];
