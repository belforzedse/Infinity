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

  const heroVar = luxurySlideFade("left", {
    ...animConfig,
    delayIn: 0.1,
    delayOut: 0.15,
  });
  const primaryVar = luxurySlideFade("right", {
    ...animConfig,
    delayIn: 0.2,
    delayOut: 0.1,
  });
  const leftActionVar = luxurySlideFade("down", {
    ...animConfig,
    distance: animConfig.distance * 0.7,
    delayIn: 0.15,
    delayOut: 0.2,
  });
  const rightActionVar = luxurySlideFade("up", {
    ...animConfig,
    distance: animConfig.distance * 0.7,
    delayIn: 0.3,
    delayOut: 0.1,
  });

  return (
    <div className="h-auto w-full max-w-full overflow-hidden">
      <div className="grid grid-cols-2 gap-6">
        {/* Left section: Primary text banner + Hero square */}
        <div className="flex flex-col gap-6">
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

          {/* Hero banner (square with background + foreground) */}
          <div className="relative aspect-square overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]">
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

        {/* Right section: Action banners (stacked) */}
        <div className="flex flex-col gap-6">
          {/* Top action banner */}
          <div className="relative flex-1 overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)]">
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

          {/* Bottom action banner */}
          <div className="relative flex-1 overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)]">
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
      </div>
    </div>
  );
}
