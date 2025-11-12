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
  slideKey?: string | number; // bump to retrigger entrance animation on active slide
};

/**
 * Mobile Hero Layout (Advanced)
 * Structure:
 * - Top: Hero banner (square with background + foreground)
 * - Middle: Primary text banner
 * - Bottom: Two action banners (responsive: side-by-side on mobile, stacked below text)
 */
export default function MobileHero({ layout, slideKey = 0 }: Props) {
  const prefersReduced = useReducedMotion();

  const animConfig = prefersReduced
    ? {
        distance: 40,
        duration: 0.7,
        ease: [0.35, 0.46, 0.45, 0.94] as any,
      }
    : {
        distance: 80,
        duration: 1.0,
        ease: [0.16, 1, 0.3, 1] as any,
      };

  const heroVar = luxurySlideFade("left", {
    ...animConfig,
    delayIn: 0.0,
    delayOut: 0.1,
  });
  const primaryVar = luxurySlideFade("right", {
    ...animConfig,
    delayIn: 0.15,
    delayOut: 0.2,
  });
  const leftActionVar = luxurySlideFade("left", {
    ...animConfig,
    distance: animConfig.distance * 0.6,
    delayIn: 0.1,
    delayOut: 0.3,
  });
  const rightActionVar = luxurySlideFade("right", {
    ...animConfig,
    distance: animConfig.distance * 0.6,
    delayIn: 0.2,
    delayOut: 0.2,
  });

  return (
    <div className="h-auto w-full max-w-full overflow-hidden">
      <div className="flex flex-col gap-3 md:flex-row md:gap-6">
        {/* Left section: Primary text banner + Hero square */}
        <div className="flex w-full flex-col gap-3 md:w-1/3">
          {/* Primary text banner (above hero square) */}
          <div className="overflow-hidden rounded-3xl">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`primary-${slideKey}`}
                variants={primaryVar}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <TextBanner
                  title={layout.primaryBanner.title}
                  subtitle={layout.primaryBanner.subtitle}
                  className={layout.primaryBanner.className}
                  titleClassName={layout.primaryBanner.titleClassName}
                  subtitleClassName={layout.primaryBanner.subtitleClassName}
                  colors={layout.primaryBanner.colors}
                  typography={layout.primaryBanner.typography}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Hero banner (square with background + foreground) - full width on mobile */}
          <div className="relative h-64 w-full md:aspect-square overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]">
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
        </div>

        {/* Right section: Action banners (2-column on tablet, stacked on mobile) */}
        <div className="flex w-full gap-4 md:w-2/3 md:flex-col">
          {/* Left action banner */}
          <div className="relative flex-1 overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`leftAction-${slideKey}`}
                variants={rightActionVar}
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

          {/* Right action banner */}
          <div className="relative flex-1 overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`rightAction-${slideKey}`}
                variants={leftActionVar}
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
