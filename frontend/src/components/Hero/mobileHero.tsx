import React from "react";
// This page is now SSR (Server Component) by removing "use client"
import BannerImage from "./Banners/BannerImage";
import { MobileLayout } from "./types";
import { AnimatePresence, motion } from "framer-motion";
import { luxurySlideFade } from "./animations";

type Props = {
  layout: MobileLayout;
  playKey?: number; // bump to retrigger entrance animation on active slide
};

export default function MobileHero({ layout, playKey = 0 }: Props) {
  // Mobile-friendly, subtle animations using default slide fade
  const heroVar = luxurySlideFade("right", { distance: 50, duration: 0.7 });
  const primaryVar = luxurySlideFade("up", { distance: 36, duration: 0.65, delayIn: 0.06 });
  const smallLeftVar = luxurySlideFade("right", { distance: 32, duration: 0.6, delayIn: 0.1 });
  const smallRightVar = luxurySlideFade("left", { distance: 32, duration: 0.6, delayIn: 0.14 });
  return (
    <>
      {/* Hero section with responsive images */}
      <div className="lg:hidden overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`hero-${playKey}`}
            variants={heroVar}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="hidden md:block">
              <BannerImage {...layout.heroDesktop} />
            </div>
            <div className="md:hidden">
              <BannerImage {...layout.heroMobile} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Secondary banners section */}
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:gap-4 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`primary-${playKey}`}
              variants={primaryVar}
              initial="initial"
              animate="animate"
              exit="exit"
              className="rounded-lg md:w-3/4"
            >
              <BannerImage {...layout.secondaryPrimary} />
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2 md:w-1/2 md:flex-col md:gap-4 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`small-left-${playKey}`}
                variants={smallLeftVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-1/2 md:w-full"
              >
                <BannerImage {...layout.secondaryTop} />
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`small-right-${playKey}`}
                variants={smallRightVar}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-1/2 md:w-full"
              >
                <BannerImage {...layout.secondaryBottom} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
