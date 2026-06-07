"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BannerImage from "./Banners/BannerImage";
import PaginationDesktop from "./PaginationDesktop";
import { useAutoplaySlider } from "./useAutoplaySlider";
import {
  resolveHeroSlideMobileImage,
  type HeroSlideConfig,
} from "@/types/super-admin/heroSliderV3";

const HERO_DESKTOP_WIDTH = 1360;
const HERO_DESKTOP_HEIGHT = 581;
const HERO_DESKTOP_SIZES = "(max-width: 1360px) 100vw, 1360px";

const HERO_MOBILE_WIDTH = 361;
const HERO_MOBILE_HEIGHT = 387;
const HERO_MOBILE_SIZES = "100vw";

type HeroBannerSliderProps = {
  slides: HeroSlideConfig[];
  autoplayInterval?: number;
  autoplayEligibility?: boolean[];
};

export default function HeroBannerSlider({
  slides,
  autoplayInterval,
  autoplayEligibility,
}: HeroBannerSliderProps) {
  const prefersReducedMotion = useReducedMotion();
  const { index, goTo, next, prev } = useAutoplaySlider({
    slidesLength: slides.length,
    autoplayInterval,
    autoplayEligibility,
  });

  if (slides.length === 0) {
    return null;
  }

  const activeSlide = slides[index] ?? slides[0];
  const mobileImage = resolveHeroSlideMobileImage(activeSlide);
  const hasMultipleSlides = slides.length > 1;

  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-[18px] lg:rounded-[34px]">
      <div className="relative aspect-[361/387] w-full overflow-hidden rounded-[inherit] bg-[#f9f1ee] lg:aspect-[1360/581]">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${activeSlide.id}-mobile`}
            className="absolute inset-0 lg:hidden"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.995 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: "easeOut" }}
          >
            <BannerImage
              src={mobileImage.url}
              alt={mobileImage.alt}
              width={HERO_MOBILE_WIDTH}
              height={HERO_MOBILE_HEIGHT}
              href={activeSlide.link?.href}
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
              sizes={HERO_MOBILE_SIZES}
              className="block h-full w-full object-cover"
              quality={90}
            />
          </motion.div>

          <motion.div
            key={`${activeSlide.id}-desktop`}
            className="absolute inset-0 hidden lg:block"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.995 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: "easeOut" }}
          >
            <BannerImage
              src={activeSlide.imageUrl}
              alt={activeSlide.imageAlt || "بنر اینفینیتی"}
              width={HERO_DESKTOP_WIDTH}
              height={HERO_DESKTOP_HEIGHT}
              href={activeSlide.link?.href}
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
              sizes={HERO_DESKTOP_SIZES}
              className="block h-full w-full object-cover"
              quality={90}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {hasMultipleSlides ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center sm:bottom-3 lg:bottom-4">
          <PaginationDesktop
            total={slides.length}
            index={index}
            onDotClick={goTo}
            onNext={next}
            onPrev={prev}
            className="pointer-events-auto bg-white/55 shadow-sm backdrop-blur-md"
            arrowClassName="text-[#623E29]"
            dotClassName="bg-[#623E29]/25"
            dotActiveClassName="bg-[#623E29]/70"
          />
        </div>
      ) : null}
    </div>
  );
}
