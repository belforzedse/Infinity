import React from "react";
import BannerImage from "./Banners/BannerImage";
import TextBanner from "./Banners/TextBanner";
import { DesktopLayout } from "./types";
import { AnimatePresence, motion } from "framer-motion";
import { slideFade, transitions } from "./animations";

type Props = {
  layout: DesktopLayout;
  slideKey: string | number;
};

export default function DesktopHero({ layout, slideKey }: Props) {
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
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`text-${slideKey}`}
                      variants={slideFade("left")}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={transitions.base}
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
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`belowLeft-${slideKey}`}
                      variants={slideFade("left")}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ ...transitions.base, delay: 0.05 }}
                    >
                      <BannerImage {...layout.belowLeft} />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="col-span-1 col-start-2 row-span-1 row-start-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`belowRight-${slideKey}`}
                      variants={slideFade("right")}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ ...transitions.base, delay: 0.1 }}
                    >
                      <BannerImage {...layout.belowRight} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
            {/* Side banner */}
            <div className="h-full w-4/12 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`side-${slideKey}`}
                  variants={slideFade("right")}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transitions.base}
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
