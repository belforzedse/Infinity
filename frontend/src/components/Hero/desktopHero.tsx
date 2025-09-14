import React from "react";
import BannerImage from "./Banners/BannerImage";
import TextBanner from "./Banners/TextBanner";
import { DesktopLayout } from "./types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { luxuryPresets, luxurySlideFade } from "./animations";

type Props = {
  layout: DesktopLayout;
  slideKey: string | number;
};

export default function DesktopHero({ layout, slideKey }: Props) {
  const prefersReduced = useReducedMotion();
  // Slower, more pronounced outside motion for high-end feel
  const outsideOpts = prefersReduced
    ? { distance: 32, duration: 0.9, scale: 0.98, ease: [0.25, 0.46, 0.45, 0.94] as any }
    : { distance: 120, duration: 1.1, scale: 0.96, ease: [0.23, 1, 0.32, 1] as any };

  const leftVariants = luxurySlideFade("left", outsideOpts);
  const rightVariants = luxurySlideFade("right", outsideOpts);
  return (
    <>
      {/*Desktop hero section*/}
      <div className="hidden h-[650px] w-full lg:block">
        <div className="grid-cols-1 grid-rows-2">
          <div className="flex gap-10">
            <div className="h-full w-7/12 flex-none">
              <div className="mt-11 grid grid-cols-2 grid-rows-2 gap-4">
                <div className="col-span-2 row-span-1">
                  {/*Wide pinterest banner*/}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`text-${slideKey}`}
                      variants={rightVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <TextBanner
                        title={layout.textBanner.title}
                        subtitle={layout.textBanner.subtitle}
                        className={layout.textBanner.className}
                        titleClassName={layout.textBanner.titleClassName}
                        subtitleClassName={layout.textBanner.subtitleClassName}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
                {/* the 2 banners below the wide banner */}
                <div className="col-span-1 col-start-1 row-span-1 row-start-2">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`belowLeft-${slideKey}`}
                      variants={rightVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <BannerImage {...layout.belowLeft} />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="col-span-1 col-start-2 row-span-1 row-start-2">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`belowRight-${slideKey}`}
                      variants={rightVariants}
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
                  variants={leftVariants}
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
    </>
  );
}
