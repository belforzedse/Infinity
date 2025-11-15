"use client";
import React from "react";
import { LeftBanner } from "./Banners/LeftBanner";
import TextBanner from "./Banners/TextBanner";
import { ActionBanner } from "./Banners/ActionBanner";
import type { TabletLayout } from "./types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { luxurySlideFade } from "./animations";

type Props = {
  layout: TabletLayout;
  slideKey?: string | number;
};

/**
 * Tablet Hero Layout (Advanced)
 * Structure:
 * - Left (1/2): Hero square + Primary text banner
 * - Right (1/2): Two stacked action banners
 */
export default function TabletHero({ layout, slideKey = 0 }: Props) {
  const prefersReduced = useReducedMotion();

  const animConfig = prefersReduced
    ? {
        distance: 60,
        duration: 0.8,
        ease: [0.35, 0.46, 0.45, 0.94] as any,
      }
    : {
        distance: 120,
        duration: 1.1,
        ease: [0.16, 1, 0.3, 1] as any,
      };

  const heroVar = luxurySlideFade("right", {
    ...animConfig,
    delayIn: 0.1,
    delayOut: 0.15,
  });
  const primaryVar = luxurySlideFade("up", {
    ...animConfig,
    delayIn: 0.2,
    delayOut: 0.1,
  });
  const leftActionVar = luxurySlideFade("left", {
    ...animConfig,
    distance: animConfig.distance * 0.7,
    delayIn: 0.15,
    delayOut: 0.2,
  });
  const rightActionVar = luxurySlideFade("left", {
    ...animConfig,
    distance: animConfig.distance * 0.7,
    delayIn: 0.3,
    delayOut: 0.1,
  });

  return (
    <div className="h-auto w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-1 gap-6">
        {/* Full-width primary text banner */}
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

        {/* Bottom grid: two actions on the left, hero square on the right */}
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:[direction:ltr]">
          {/* Action banners stacked on the left */}
          <div className="flex flex-col gap-6 md:h-full md:justify-end" dir="rtl">
            <div className="relative rounded-lg overflow-visible [backface-visibility:hidden] [transform:translateZ(0)]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`left-action-${slideKey}`}
                  variants={leftActionVar}
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

            <div className="relative rounded-lg overflow-visible [backface-visibility:hidden] [transform:translateZ(0)]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`right-action-${slideKey}`}
                  variants={rightActionVar}
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

          {/* Hero banner square on the right */}
          <div
            className="relative aspect-square overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]"
            dir="rtl"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`hero-${slideKey}`}
                variants={heroVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full w-full"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <LeftBanner spec={layout.heroBanner} className="h-full w-full" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
