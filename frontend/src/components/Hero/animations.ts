import type { Variants } from "framer-motion";

export type SlideFadeOptions = {
  distance?: number; // px
  duration?: number; // seconds
  ease?: any; // e.g., "easeOut" or custom bezier
};

export const defaultSlideFadeOptions: Required<SlideFadeOptions> = {
  distance: 40,
  duration: 0.45,
  ease: "easeOut",
};

export function slideFade(
  direction: "left" | "right",
  opts: SlideFadeOptions = {},
): Variants {
  const { distance, duration, ease } = { ...defaultSlideFadeOptions, ...opts };
  const x = direction === "left" ? -distance : distance;
  return {
    initial: { opacity: 0, x },
    animate: { opacity: 1, x: 0, transition: { duration, ease } as any },
    exit: { opacity: 0, x, transition: { duration, ease } as any },
  };
}

export const transitions = {
  fast: { duration: 0.3, ease: "easeOut" } as any,
  base: { duration: 0.45, ease: "easeOut" } as any,
  slow: { duration: 0.6, ease: "easeOut" } as any,
};
