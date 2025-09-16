import type { Variants, Transition } from "framer-motion";

export type LuxurySlideFadeOptions = {
  distance?: number; // px
  duration?: number; // seconds
  ease?: string | number[]; // easing curve
  scale?: number; // scale effect (0.9 - 1.1)
  blur?: number; // blur effect in px
  stagger?: number; // stagger delay for children
  springDamping?: number; // spring damping (10-40)
  springStiffness?: number; // spring stiffness (100-400)
  useSpring?: boolean; // use spring animation instead of ease
  delay?: number; // legacy: apply to both enter/exit
  delayIn?: number; // enter delay only
  delayOut?: number; // exit delay only
};

export const defaultLuxurySlideFadeOptions: Required<LuxurySlideFadeOptions> = {
  distance: 24,
  duration: 0.8,
  ease: [0.16, 1, 0.3, 1], // Luxury cubic-bezier curve
  scale: 0.96,
  blur: 0,
  stagger: 0.08,
  springDamping: 25,
  springStiffness: 200,
  useSpring: false,
  delay: 0,
  delayIn: 0,
  delayOut: 0,
};

export function luxurySlideFade(
  direction: "left" | "right" | "up" | "down",
  opts: LuxurySlideFadeOptions = {},
): Variants {
  const {
    distance,
    duration,
    ease,
    scale,
    blur,
    stagger,
    springDamping,
    springStiffness,
    useSpring,
    delay,
    delayIn,
    delayOut,
  } = { ...defaultLuxurySlideFadeOptions, ...opts };

  const getOffset = () => {
    switch (direction) {
      case "left":
        return { x: -distance, y: 0 };
      case "right":
        return { x: distance, y: 0 };
      case "up":
        return { x: 0, y: -distance };
      case "down":
        return { x: 0, y: distance };
    }
  };

  const offset = getOffset();

  const transition: Transition = useSpring
    ? {
        type: "spring",
        damping: springDamping,
        stiffness: springStiffness,
        mass: 1,
      }
    : {
        duration,
        ease,
      };

  return {
    initial: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
      scale,
      filter: blur > 0 ? `blur(${blur}px)` : "blur(0px)",
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        ...transition,
        staggerChildren: stagger,
        delay: (typeof delayIn === "number" ? delayIn : delay) || 0,
      } as any,
    },
    exit: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
      scale,
      filter: blur > 0 ? `blur(${blur}px)` : "blur(0px)",
      transition: {
        ...transition,
        staggerChildren: stagger * 0.5,
        delay: (typeof delayOut === "number" ? delayOut : delay) || 0,
      } as any,
    },
  };
}

// Preset luxury animations
export const luxuryPresets = {
  // Subtle and elegant
  whisper: (direction: "left" | "right" | "up" | "down") =>
    luxurySlideFade(direction, {
      distance: 16,
      duration: 1.0,
      ease: [0.25, 0.46, 0.45, 0.94],
      scale: 0.98,
      stagger: 0.12,
    }),

  // Premium and smooth
  silk: (direction: "left" | "right" | "up" | "down") =>
    luxurySlideFade(direction, {
      distance: 32,
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      scale: 0.94,
      blur: 2,
      stagger: 0.1,
    }),

  // High-end and dramatic
  velvet: (direction: "left" | "right" | "up" | "down") =>
    luxurySlideFade(direction, {
      distance: 48,
      duration: 1.2,
      ease: [0.23, 1, 0.32, 1],
      scale: 0.9,
      blur: 4,
      stagger: 0.15,
    }),

  // Spring-based luxury
  cashmere: (direction: "left" | "right" | "up" | "down") =>
    luxurySlideFade(direction, {
      useSpring: true,
      distance: 28,
      springDamping: 20,
      springStiffness: 150,
      scale: 0.95,
      stagger: 0.08,
    }),
};

// Enhanced transition presets
export const luxuryTransitions = {
  // Ultra smooth
  butter: {
    duration: 0.8,
    ease: [0.16, 1, 0.3, 1],
  } as Transition,

  // Elegant and refined
  champagne: {
    duration: 1.0,
    ease: [0.25, 0.46, 0.45, 0.94],
  } as Transition,

  // Premium spring
  marble: {
    type: "spring",
    damping: 25,
    stiffness: 200,
    mass: 0.8,
  } as Transition,

  // Luxurious and slow
  gold: {
    duration: 1.4,
    ease: [0.23, 1, 0.32, 1],
  } as Transition,

  // Quick but refined
  crystal: {
    duration: 0.6,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,
};

// Stagger utilities for luxury timing
export const luxuryStagger = {
  children: (delay = 0.0) => ({
    staggerChildren: delay,
    delayChildren: 0.1,
  }),

  cascade: (delay = 0.12) => ({
    staggerChildren: delay,
    delayChildren: 0.15,
    staggerDirection: 1,
  }),

  wave: (delay = 0.1) => ({
    staggerChildren: delay,
    delayChildren: 0.2,
    staggerDirection: -1,
  }),
};

// Advanced luxury variant builder
export function createLuxuryVariant(
  name: string,
  baseAnimation: any,
  customTransition?: Transition,
): Variants {
  return {
    [name]: {
      ...baseAnimation,
      transition: customTransition || luxuryTransitions.butter,
    },
  };
}

// Keyframed slide variant with per-segment eases and times
export type LuxurySlideKFOptions = LuxurySlideFadeOptions & {
  times?: number[]; // e.g., [0, 0.6, 1]
  eases?: Array<string | number[]>; // one per segment
  factors?: number[]; // multiplies offset per frame, default [1, 0.5, 0]
};

export function luxurySlideKeyframes(
  direction: "left" | "right" | "up" | "down",
  opts: LuxurySlideKFOptions = {},
): Variants {
  const {
    distance,
    duration,
    ease,
    scale,
    springDamping,
    springStiffness,
    useSpring,
    delay,
    delayIn,
    delayOut,
    times,
    eases,
    factors,
  } = { ...defaultLuxurySlideFadeOptions, ...opts } as any;

  const getOffset = () => {
    switch (direction) {
      case "left":
        return { x: -distance, y: 0 };
      case "right":
        return { x: distance, y: 0 };
      case "up":
        return { x: 0, y: -distance };
      case "down":
        return { x: 0, y: distance };
    }
  };

  const offset = getOffset();

  const ks = (
    factors && factors.length >= 2 ? factors : [1, 0.5, 0]
  ) as number[];
  const xFrames = offset.x ? ks.map((k) => k * offset.x) : undefined;
  const yFrames = offset.y ? ks.map((k) => k * offset.y) : undefined;
  const scaleFrames =
    typeof scale === "number" && scale !== 1 ? [scale, 1] : undefined;

  const timeArray = (
    times && times.length === ks.length ? times : [0, 0.65, 1]
  ) as number[];
  const easeArray = (
    eases && eases.length === ks.length - 1
      ? eases
      : [ease || "easeOut", ease || "easeOut"]
  ) as any[];

  const baseTransition: Transition = useSpring
    ? {
        type: "spring",
        damping: springDamping,
        stiffness: springStiffness,
        mass: 1,
      }
    : ({ duration, ease: ease || "easeOut" } as Transition);

  const enterDelay = (typeof delayIn === "number" ? delayIn : delay) || 0;
  const exitDelay = (typeof delayOut === "number" ? delayOut : delay) || 0;

  return {
    initial: {
      x: offset.x,
      y: offset.y,
      ...(scaleFrames ? { scale: scaleFrames[0] } : {}),
    },
    animate: {
      ...(xFrames ? { x: xFrames } : {}),
      ...(yFrames ? { y: yFrames } : {}),
      ...(scaleFrames ? { scale: scaleFrames } : {}),
      transition: {
        ...baseTransition,
        times: timeArray,
        ease: easeArray as any,
        delay: enterDelay,
      } as any,
    },
    exit: {
      ...(xFrames ? { x: [...xFrames].reverse() } : {}),
      ...(yFrames ? { y: [...yFrames].reverse() } : {}),
      ...(scaleFrames
        ? { scale: [...(scaleFrames as number[])].reverse() }
        : {}),
      transition: {
        ...baseTransition,
        times: [...timeArray].reverse(),
        ease: [...easeArray].reverse() as any,
        delay: exitDelay,
      } as any,
    },
  };
}

// Usage examples:
/*
// Basic luxury slide fade
const slideVariants = luxurySlideFade("left");

// Using presets
const whisperVariants = luxuryPresets.whisper("right");
const silkVariants = luxuryPresets.silk("up");

// Custom luxury animation
const customVariants = luxurySlideFade("left", {
  distance: 40,
  duration: 1.0,
  ease: [0.16, 1, 0.3, 1],
  scale: 0.92,
  blur: 3,
  stagger: 0.1,
});

// In component:
<motion.div
  variants={silkVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Content
</motion.div>
*/
