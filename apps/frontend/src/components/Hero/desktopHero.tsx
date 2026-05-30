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

const DESKTOP_HERO_WIDTH = 1358;
const DESKTOP_HERO_HEIGHT = 480;

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
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let animationFrame = 0;
    const timeouts: number[] = [];

    const updateScale = () => {
      const width = frame.offsetWidth || frame.getBoundingClientRect().width;
      if (width > 0) {
        setScale(Math.min(1, width / DESKTOP_HERO_WIDTH));
      }
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateScale);
    };

    updateScale();
    scheduleUpdate();
    timeouts.push(window.setTimeout(updateScale, 80));
    timeouts.push(window.setTimeout(updateScale, 240));

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(frame);
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

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
    <div
      ref={frameRef}
      className="relative mx-auto w-full max-w-[1358px] overflow-visible"
      style={{
        height: DESKTOP_HERO_HEIGHT * scale,
      }}
    >
      <div
        className="absolute left-0 top-0 h-[480px] w-[1358px] origin-top-left overflow-hidden"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        <div className="flex h-full items-stretch gap-2 lg:gap-0">
          {/* Left section (7/12): Text banner + action banners */}
          <div className="mt-[50px] h-[430px] w-7/12 flex-none overflow-visible">
            <div className="flex flex-col h-full">
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
                      marginBottomPx={layout.topLeftTextBanner.marginBottomPx}
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
              <div className="grid flex-1 grid-cols-2 items-end gap-3">
                {/* Left action banner */}
                <div className="h-[180px] overflow-visible rounded-lg">
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
                <div className="h-[180px] overflow-visible rounded-lg">
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

          {/* Left section (5/12): Left banner with background + foreground */}
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
