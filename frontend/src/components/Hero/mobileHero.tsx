"use client";
import React from "react";
import BannerImage from "./Banners/BannerImage";
import { ActionBanner } from "./Banners/ActionBanner";
import type { MobileLayout } from "./types";
import { AnimatePresence, motion } from "framer-motion";
import { luxurySlideFade } from "./animations";

type Props = {
  layout: MobileLayout;
  playKey?: number; // bump to retrigger entrance animation on active slide
};

/**
 * Mobile Hero Layout
 * Structure:
 * - Top: Hero banner (responsive via sizes prop)
 * - Middle: Primary large banner
 * - Bottom: Two stacked action banners (responsive: horizontal on mobile, vertical on md+)
 */
export default function MobileHero({ layout, playKey = 0 }: Props) {
  const heroVar = luxurySlideFade("right", {
    distance: 50,
    duration: 0.6,
    delayIn: 0.2,
    delayOut: 0.1,
  });
  const primaryVar = luxurySlideFade("right", {
    distance: 200,
    duration: 0.6,
    delayIn: 0.5,
    delayOut: 0.3,
  });
  const topActionVar = luxurySlideFade("left", {
    distance: 70,
    duration: 0.6,
    delayIn: 0.1,
    delayOut: 0.3,
  });
  const bottomActionVar = luxurySlideFade("left", {
    distance: 70,
    duration: 0.6,
    delayIn: 0.3,
    delayOut: 0.2,
  });

  return (
    <>
      {/* Hero banner at top */}
      <div className="relative w-full overflow-hidden rounded-lg [backface-visibility:hidden] [transform:translateZ(0)] [will-change:transform]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`hero-${playKey}`}
            variants={heroVar}
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

      {/* Primary + Action Banners section */}
      <div className="mt-4 flex flex-col gap-2 md:flex-row md:gap-4">
        {/* Primary banner - large on md+ */}
        <div className="relative w-full overflow-hidden rounded-lg md:w-3/4 [backface-visibility:hidden] [transform:translateZ(0)]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`primary-${playKey}`}
              variants={primaryVar}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 h-full w-full"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <BannerImage {...layout.primaryBanner} />
            </motion.div>
          </AnimatePresence>
          <div className="invisible">
            <BannerImage {...layout.primaryBanner} />
          </div>
        </div>

        {/* Action banners - horizontal on mobile, vertical on md+ */}
        <div className="flex gap-2 md:w-1/4 md:flex-col md:gap-4">
          {/* Top action banner */}
          <div className="relative w-1/2 overflow-hidden rounded-lg md:w-full aspect-square md:aspect-auto [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`topAction-${playKey}`}
                variants={topActionVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 h-full w-full"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <ActionBanner spec={layout.topActionBanner} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom action banner */}
          <div className="relative w-1/2 overflow-hidden rounded-lg md:w-full aspect-square md:aspect-auto [backface-visibility:hidden] [transform:translateZ(0)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`bottomAction-${playKey}`}
                variants={bottomActionVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 h-full w-full"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <ActionBanner spec={layout.bottomActionBanner} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
