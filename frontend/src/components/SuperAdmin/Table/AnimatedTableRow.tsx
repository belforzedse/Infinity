"use client";

import { cubicBezier, motion, useIsPresent } from "framer-motion";
import type { ReactNode, DragEvent } from "react";

interface AnimatedTableRowProps {
  children: ReactNode;
  /**
   * Mark row as freshly added.
   * New rows fade in without layout projection to avoid the downward "kick".
   */
  isNew?: boolean;
  /**
   * Page transition mode: fade out old page rows / fade in new page rows without movement.
   */
  isPageTransitioning?: boolean;
  /**
   * Kept for backward compatibility but not used internally.
   * Use this as the React `key` at the mapping site instead.
   *
   * Example:
   *   {rows.map(row => (
   *     <AnimatedTableRow key={row.id} rowKey={row.id} ... />
   *   ))}
   */
  rowKey?: string;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: DragEvent<HTMLTableRowElement>) => void;
  onDrop?: (e: DragEvent<HTMLTableRowElement>) => void;
  className?: string;
}

/**
 * Animated table row component with enter/exit + layout animations.
 *
 * - New items: fade in only (no layout projection to prevent vertical kick)
 * - Removed items: fade out with a small horizontal slide (no height collapse)
 * - Existing items: smooth repositioning with layout="position"
 *
 * IMPORTANT:
 *   Put the real React `key` on the parent map element, not inside this component.
 *   This component assumes it is rendered as a direct child of <AnimatePresence>.
 */
export function AnimatedTableRow({
  children,
  isNew = false,
  isPageTransitioning = false,
  rowKey, // unused, kept for compatibility
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  className,
}: AnimatedTableRowProps) {
  const isPresent = useIsPresent();
  const ease = cubicBezier(0.28, 0.84, 0.42, 1);

  const layoutMode = !isNew && isPresent && !isPageTransitioning ? "position" : false;
  const initialState = isPageTransitioning
    ? { opacity: 0 }
    : isNew
      ? { opacity: 0 }
      : false;
  const animateState = { opacity: 1 };
  const exitState = isPageTransitioning
    ? { opacity: 0 }
    : { opacity: 0, x: 28, scale: 0.99 };

  const transitionConfig = isPageTransitioning
    ? {
        type: "tween",
        ease,
        opacity: { duration: 0.18, ease },
      }
    : {
        type: "tween",
        ease,
        layout: { duration: 0.22, ease, type: "tween" },
        opacity: { duration: isNew ? 0.26 : 0.2, ease },
        x: { duration: 0.24, ease },
        scale: { duration: 0.22, ease },
      };

  return (
    <motion.tr
      layout={layoutMode}
      initial={initialState}
      animate={animateState}
      exit={exitState}
      transition={transitionConfig}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={className}
    >
      {children}
    </motion.tr>
  );
}
