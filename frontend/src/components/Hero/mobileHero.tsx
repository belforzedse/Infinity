"use client";
import React from "react";
import { LeftBanner } from "./Banners/LeftBanner";
import TextBanner from "./Banners/TextBanner";
import { ActionBanner } from "./Banners/ActionBanner";
import type { MobileLayout } from "./types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { luxurySlideFade } from "./animations";

type Props = {
  layout: MobileLayout;
  slideKey?: string | number;
};

/**
 * Mobile Hero Layout (Reference-matching)
 * - Top: Headline block
 * - Middle: Main visual
 * - Bottom: Two cards in one row
 */
export default function MobileHero({ layout, slideKey = 0 }: Props) {
  const prefersReduced = useReducedMotion();

  const animConfig = prefersReduced
    ? {
        distance: 36,
        duration: 0.7,
        ease: [0.35, 0.46, 0.45, 0.94] as any,
      }
    : {
        distance: 70,
        duration: 1.0,
        ease: [0.16, 1, 0.3, 1] as any,
      };

  const headlineVar = luxurySlideFade("up", {
    ...animConfig,
    delayIn: 0.06,
    delayOut: 0.1,
  });
  const heroVar = luxurySlideFade("left", {
    ...animConfig,
    delayIn: 0.14,
    delayOut: 0.18,
  });
  const leftCardVar = luxurySlideFade("right", {
    ...animConfig,
    distance: animConfig.distance * 0.6,
    delayIn: 0.2,
    delayOut: 0.2,
  });
  const rightCardVar = luxurySlideFade("left", {
    ...animConfig,
    distance: animConfig.distance * 0.6,
    delayIn: 0.24,
    delayOut: 0.24,
  });

  return (
    <div className="h-auto w-full max-w-full overflow-hidden" dir="rtl">
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-3xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`primary-${slideKey}`}
              variants={headlineVar}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <TextBanner
                title={layout.primaryBanner.title}
                subtitle={layout.primaryBanner.subtitle}
                marginBottomPx={layout.primaryBanner.marginBottomPx}
                className={layout.primaryBanner.className}
                titleClassName={layout.primaryBanner.titleClassName}
                subtitleClassName={layout.primaryBanner.subtitleClassName}
                colors={layout.primaryBanner.colors}
                typography={layout.primaryBanner.typography}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative h-[360px] w-full overflow-hidden rounded-3xl [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`hero-${slideKey}`}
              variants={heroVar}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full w-full overflow-hidden"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <LeftBanner spec={layout.heroBanner} className="h-full w-full" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative overflow-visible rounded-xl [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`leftCard-${slideKey}`}
                variants={leftCardVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full w-full"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <ActionBanner spec={layout.bottomActionBannerLeft} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative overflow-visible rounded-xl [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`rightCard-${slideKey}`}
                variants={rightCardVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full w-full"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <ActionBanner spec={layout.bottomActionBannerRight} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
