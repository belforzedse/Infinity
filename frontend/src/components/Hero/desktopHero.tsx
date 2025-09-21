import React from "react";
import BannerImage from "./Banners/BannerImage";
import TextBanner from "./Banners/TextBanner";
import { DesktopLayout } from "./types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { luxurySlideFade } from "./animations";

type Props = {
  layout: DesktopLayout;
  slideKey: string | number;
};

export default function DesktopHero({ layout, slideKey }: Props) {
  const prefersReduced = useReducedMotion();
  // Slower, more pronounced outside motion for high-end feel
  const outsideOpts =
    prefersReduced ?
      {
        distance: 160,
        duration: 0.99,
        scale: 0.98,
        ease: [0.35, 0.46, 0.45, 0.94] as any,
      }
    : {
        distance: 220,
        duration: 1.5,
        scale: 0.98,
        ease: [0.11, 1, 0.001, 1] as any,
      };

  // Per-element sequencing: control each small tile independently
  const smallLeftDelayIn = 0.22;
  const smallLeftDelayOut = 0.0;
  const smallRightDelayIn = 0.0;
  const smallRightDelayOut = 0.14;
  const bigDelay = 0.24;
  const wideDelay = 0.28;

  const belowLeftVariants = luxurySlideFade("right", {
    ...outsideOpts,
    delayIn: smallLeftDelayIn,
    delayOut: smallLeftDelayOut,
  });
  const belowRightVariants = luxurySlideFade("right", {
    ...outsideOpts,
    delayIn: smallRightDelayIn,
    delayOut: smallRightDelayOut,
  });
  const sideVariants = luxurySlideFade("left", {
    ...outsideOpts,
    delayIn: bigDelay,
    delayOut: bigDelay,
  });
  const wideTextVariants = luxurySlideFade("right", {
    ...outsideOpts,
    delayIn: wideDelay,
    delayOut: wideDelay,
  });
  return (
    <>
      {/*Desktop hero section*/}
      <div className="h-[600px] w-[1358px] max-w-full">
        <div className="relative h-[650px] w-full overflow-hidden overflow-y-auto">
          <div className="h-full grid-cols-1 grid-rows-2">
            <div className="flex h-full gap-10">
              <div className="h-full w-7/12 flex-none">
                <div className="mt-11 grid h-[calc(100%-2.75rem)] grid-cols-2 grid-rows-[200px_1fr] gap-4">
                  <div className="col-span-2 row-span-1">
                    {/*Wide pinterest banner*/}
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={`text-${slideKey}`}
                        variants={wideTextVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <TextBanner
                          title={layout.textBanner.title}
                          subtitle={layout.textBanner.subtitle}
                          className={layout.textBanner.className}
                          titleClassName={layout.textBanner.titleClassName}
                          subtitleClassName={
                            layout.textBanner.subtitleClassName
                          }
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {/* the 2 banners below the wide banner */}
                  <div className="col-span-1 col-start-1 row-span-1 row-start-2 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={`belowLeft-${slideKey}`}
                        variants={belowLeftVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <BannerImage {...layout.belowLeft} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="col-span-1 col-start-2 row-span-1 row-start-2 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={`belowRight-${slideKey}`}
                        variants={belowRightVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <BannerImage {...layout.belowRight} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              {/* Side banner */}
              <div className="h-full w-4/12 flex-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`side-${slideKey}`}
                    variants={sideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <BannerImage {...layout.side} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
