"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { useCallback, useState } from "react";
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
const SLIDE_SWIPE_THRESHOLD = 56;
const SLIDE_SWIPE_VELOCITY = 420;

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
  const [slideDirection, setSlideDirection] = useState(1);
  const { index, goTo, next, prev } = useAutoplaySlider({
    slidesLength: slides.length,
    autoplayInterval,
    autoplayEligibility,
  });
  const hasMultipleSlides = slides.length > 1;
  const slideVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? "7%" : "-7%",
      scale: 1.01,
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? "-7%" : "7%",
      scale: 1.005,
    }),
  };
  const slideTransition = {
    duration: prefersReducedMotion ? 0 : 0.48,
    ease: [0.22, 1, 0.36, 1],
  } as const;

  const goToSlide = useCallback(
    (targetIndex: number) => {
      setSlideDirection(targetIndex > index ? 1 : -1);
      goTo(targetIndex);
    },
    [goTo, index],
  );

  const goNext = useCallback(() => {
    setSlideDirection(1);
    next();
  }, [next]);

  const goPrev = useCallback(() => {
    setSlideDirection(-1);
    prev();
  }, [prev]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!hasMultipleSlides) return;

      const shouldSwipe =
        Math.abs(info.offset.x) > SLIDE_SWIPE_THRESHOLD ||
        Math.abs(info.velocity.x) > SLIDE_SWIPE_VELOCITY;

      if (!shouldSwipe) return;

      if (info.offset.x < 0) {
        goNext();
      } else {
        goPrev();
      }
    },
    [goNext, goPrev, hasMultipleSlides],
  );

  if (slides.length === 0) {
    return null;
  }

  const activeSlide = slides[index] ?? slides[0];
  const mobileImage = resolveHeroSlideMobileImage(activeSlide);

  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-[18px] lg:rounded-[34px]">
      <motion.div
        className="relative aspect-[361/387] w-full touch-pan-y overflow-hidden rounded-[inherit] bg-[#f9f1ee] lg:aspect-[1360/581]"
        drag={hasMultipleSlides && !prefersReducedMotion ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
          <motion.div
            key={`${activeSlide.id}-mobile`}
            className="absolute inset-0 lg:hidden"
            custom={slideDirection}
            variants={slideVariants}
            initial={prefersReducedMotion ? false : "enter"}
            animate="center"
            exit={prefersReducedMotion ? undefined : "exit"}
            transition={slideTransition}
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
            custom={slideDirection}
            variants={slideVariants}
            initial={prefersReducedMotion ? false : "enter"}
            animate="center"
            exit={prefersReducedMotion ? undefined : "exit"}
            transition={slideTransition}
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
      </motion.div>

      {hasMultipleSlides ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center sm:bottom-3 lg:bottom-4">
          <PaginationDesktop
            total={slides.length}
            index={index}
            onDotClick={goToSlide}
            onNext={goNext}
            onPrev={goPrev}
            className="pointer-events-auto bg-white/45 shadow-sm backdrop-blur-md"
            arrowClassName="text-[#623E29]"
            dotClassName="bg-[#623E29]/25"
            dotActiveClassName="bg-[#623E29]/70"
          />
        </div>
      ) : null}
    </div>
  );
}
