import React from "react";
import TextBanner from "./Banners/TextBanner";
import { ActionBanner } from "./Banners/ActionBanner";
import { LeftBanner } from "./Banners/LeftBanner";
import type { DesktopLayout } from "./types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { luxurySlideFade } from "./animations";

type Props = {
  layout: DesktopLayout;
  slideKey: string | number;
};

/**
 * Desktop Hero Layout
 * Structure:
 * - Left (7/12 width):
 *   - Top: Text banner
 *   - Bottom: Two action banners in a grid
 * - Right (5/12 width): Large image banner
 */
export default function DesktopHero({ layout, slideKey }: Props) {
  const prefersReduced = useReducedMotion();

  const outsideOpts = prefersReduced
    ? {
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

  // Animation delays for each element
  const actionLeftDelayIn = 0.22;
  const actionLeftDelayOut = 0.0;
  const actionRightDelayIn = 0.0;
  const actionRightDelayOut = 0.14;
  const rightImageDelay = 0.24;
  const textBannerDelay = 0.28;

  const actionLeftVariants = luxurySlideFade("right", {
    ...outsideOpts,
    delayIn: actionLeftDelayIn,
    delayOut: actionLeftDelayOut,
  });

  const actionRightVariants = luxurySlideFade("right", {
    ...outsideOpts,
    delayIn: actionRightDelayIn,
    delayOut: actionRightDelayOut,
  });

  const rightImageVariants = luxurySlideFade("left", {
    ...outsideOpts,
    delayIn: rightImageDelay,
    delayOut: rightImageDelay,
  });

  const textBannerVariants = luxurySlideFade("right", {
    ...outsideOpts,
    delayIn: textBannerDelay,
    delayOut: textBannerDelay,
  });

  return (
    <div className="h-[480px] w-[1358px] max-w-full">
      <div className="relative h-full w-full">
        <div className="flex h-full items-stretch gap-2 lg:gap-0">
          {/* Left section (7/12): Text banner + action banners */}
          <div className="w-7/12 flex-none">
            <div className="mt-[50px] flex flex-col">
              {/* Top: Text banner */}
              <div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`textBanner-${slideKey}`}
                    variants={textBannerVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <TextBanner
                      title={layout.topLeftTextBanner.title}
                      subtitle={layout.topLeftTextBanner.subtitle}
                      className={layout.topLeftTextBanner.className}
                      titleClassName={layout.topLeftTextBanner.titleClassName}
                      subtitleClassName={layout.topLeftTextBanner.subtitleClassName}
                      colors={layout.topLeftTextBanner.colors}
                      typography={layout.topLeftTextBanner.typography}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom: Two action banners in grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Left action banner */}
                <div className="h-[400px] overflow-hidden rounded-lg">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`actionLeft-${slideKey}`}
                      variants={actionLeftVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="h-full w-full"
                    >
                      <ActionBanner spec={layout.bottomActionBannerLeft} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Right action banner */}
                <div className="h-[400px] overflow-hidden rounded-lg">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`actionRight-${slideKey}`}
                      variants={actionRightVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="h-full w-full"
                    >
                      <ActionBanner spec={layout.bottomActionBannerRight} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Right section (5/12): Right banner with background + foreground */}
          <div className="w-5/12 flex-none">
            <div className="h-full w-full overflow-visible rounded-lg">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`rightBanner-${slideKey}`}
                  variants={rightImageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="h-full w-full"
                >
                  <LeftBanner spec={layout.rightBanner} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
