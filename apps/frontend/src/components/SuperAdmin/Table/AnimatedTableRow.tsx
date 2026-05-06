"use client";

import type { ReactNode, DragEvent } from "react";

interface AnimatedTableRowProps {
  children: ReactNode;
  isNew?: boolean;
  isPageTransitioning?: boolean;
  rowKey?: string;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: DragEvent<HTMLTableRowElement>) => void;
  onDrop?: (e: DragEvent<HTMLTableRowElement>) => void;
  className?: string;
}

/**
 * Table row component. Animation removed for lighter weight on older devices.
 */
export function AnimatedTableRow({
  children,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  className,
}: AnimatedTableRowProps) {
  return (
    <tr
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={className}
    >
      {children}
    </tr>
  );
}
