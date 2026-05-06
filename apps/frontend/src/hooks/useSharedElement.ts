"use client";

import { useEffect, useRef } from "react";
import { useSharedElementTransition } from "@/contexts/SharedElementTransitionContext";

interface UseSharedElementOptions {
  id: string;
  data?: Record<string, unknown>;
  enabled?: boolean;
}

/**
 * Hook to register an element for shared element transitions
 */
export function useSharedElement({ id, data, enabled = true }: UseSharedElementOptions) {
  const elementRef = useRef<HTMLElement | null>(null);
  const { registerElement, unregisterElement } = useSharedElementTransition();

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    registerElement(id, elementRef.current, data);

    return () => {
      unregisterElement(id);
    };
  }, [id, data, enabled, registerElement, unregisterElement]);

  return elementRef;
}

