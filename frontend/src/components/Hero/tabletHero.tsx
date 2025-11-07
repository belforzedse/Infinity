"use client";
import React from "react";
import BannerImage from "./Banners/BannerImage";
import type { TabletLayout } from "./types";
import { AnimatePresence, motion } from "framer-motion";
import { luxurySlideFade } from "./animations";

type Props = {
  layout: TabletLayout;
  playKey?: number;
};

export default function TabletHero({ layout, playKey = 0 }: Props) {
  // Tablet animations - moderate between mobile and desktop
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

      {/* Secondary section: left banners stacked (smaller), right banner (bigger) */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Left column - 2 stacked smaller banners */}
        <div className="flex flex-col gap-4">
          <div className="relative h-40 w-full rounded-lg [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`left-top-${playKey}`}
                variants={leftTopVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 h-full w-full"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <BannerImage {...layout.leftTopBanner} />
              </motion.div>
            </AnimatePresence>
            <div className="invisible h-40">
              <BannerImage {...layout.leftTopBanner} />
            </div>
          </div>

          <div className="relative h-40 w-full rounded-lg [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`left-bottom-${playKey}`}
                variants={leftBottomVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 h-full w-full"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <BannerImage {...layout.leftBottomBanner} />
              </motion.div>
            </AnimatePresence>
            <div className="invisible h-40">
              <BannerImage {...layout.leftBottomBanner} />
            </div>
          </div>
        </div>

        {/* Right column - large banner (bigger) */}
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
              className="absolute inset-0 h-full w-full"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <BannerImage {...layout.rightBanner} />
            </motion.div>
          </AnimatePresence>
          <div className="invisible" style={{ height: "368px" }}>
            <BannerImage {...layout.rightBanner} />
          </div>
        </div>
      </div>
    </>
  );
}
