"use client";
import React from "react";
import BannerImage from "./Banners/BannerImage";
import { LeftBanner } from "./Banners/LeftBanner";
import { ActionBanner } from "./Banners/ActionBanner";
import type { TabletLayout } from "./types";
import { AnimatePresence, motion } from "framer-motion";
import { luxurySlideFade } from "./animations";

type Props = {
  layout: TabletLayout;
  playKey?: number;
};

/**
 * Tablet Hero Layout
 * Structure:
 * - Top: Full-width hero banner
 * - Bottom: 2-column grid
 *   - Left: Two stacked action banners (h-40 each)
 *   - Right: LeftBanner with background + foreground (h-368)
 */
export default function TabletHero({ layout, playKey = 0 }: Props) {
  const heroBannerVar = luxurySlideFade("right", {
    distance: 80,
    duration: 0.7,
    delayIn: 0.2,
    delayOut: 0.1,
  });
  const rightBannerVar = luxurySlideFade("left", {
    distance: 100,
    duration: 0.7,
    delayIn: 0.4,
    delayOut: 0.2,
  });
  const leftTopVar = luxurySlideFade("up", {
    distance: 60,
    duration: 0.7,
    delayIn: 0.1,
    delayOut: 0.3,
  });
  const leftBottomVar = luxurySlideFade("down", {
    distance: 60,
    duration: 0.7,
    delayIn: 0.3,
    delayOut: 0.2,
  });

  return (
    <>
      {/* Hero banner on top - full width */}
      <div className="relative w-full overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`hero-${playKey}`}
            variants={heroBannerVar}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 h-full w-full"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <BannerImage {...layout.heroBanner} />
          </motion.div>
        </AnimatePresence>
        {/* Spacer to maintain height */}
        <div className="invisible">
          <BannerImage {...layout.heroBanner} />
        </div>
      </div>

      {/* Secondary section: left action banners (stacked), right LeftBanner */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Left column - 2 stacked action banners */}
        <div className="flex flex-col gap-4">
          {/* Top action banner */}
          <div className="h-40 overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`left-top-${playKey}`}
                variants={leftTopVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full w-full"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <ActionBanner spec={layout.leftBannerTop} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom action banner */}
          <div className="h-40 overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`left-bottom-${playKey}`}
                variants={leftBottomVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full w-full"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <ActionBanner spec={layout.leftBannerBottom} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right column - LeftBanner with background + foreground */}
        <div
          className="relative overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)]"
          style={{ height: "368px" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`right-${playKey}`}
              variants={rightBannerVar}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full w-full"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <LeftBanner spec={layout.rightBanner} className="h-full w-full" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
