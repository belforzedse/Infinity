"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

interface SharedElement {
  id: string;
  element: HTMLElement;
  data?: Record<string, unknown>;
}

interface SharedElementTransitionContextType {
  registerElement: (id: string, element: HTMLElement, data?: Record<string, unknown>) => void;
  unregisterElement: (id: string) => void;
  getElement: (id: string) => SharedElement | null;
  transition: (fromId: string, toId: string) => Promise<void>;
}

const SharedElementTransitionContext = createContext<SharedElementTransitionContextType | null>(
  null,
);

export const useSharedElementTransition = () => {
  const context = useContext(SharedElementTransitionContext);
  if (!context) {
    throw new Error(
      "useSharedElementTransition must be used within SharedElementTransitionProvider",
    );
  }
  return context;
};

export function SharedElementTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [elements, setElements] = useState<Map<string, SharedElement>>(new Map());
  const pathname = usePathname();
  const previousPathname = useRef<string>(pathname);

  // Clear elements when route changes
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      setElements(new Map());
      previousPathname.current = pathname;
    }
  }, [pathname]);

  const registerElement = (
    id: string,
    element: HTMLElement,
    data?: Record<string, unknown>,
  ) => {
    setElements((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, { id, element, data });
      return newMap;
    });
  };

  const unregisterElement = (id: string) => {
    setElements((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const getElement = (id: string): SharedElement | null => {
    return elements.get(id) || null;
  };

  const transition = async (fromId: string, toId: string): Promise<void> => {
    const fromElement = elements.get(fromId);
    const toElement = elements.get(toId);

    if (!fromElement || !toElement) return;

    const fromRect = fromElement.element.getBoundingClientRect();
    const toRect = toElement.element.getBoundingClientRect();

    // Create a clone of the from element for animation
    const clone = fromElement.element.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.left = `${fromRect.left}px`;
    clone.style.top = `${fromRect.top}px`;
    clone.style.width = `${fromRect.width}px`;
    clone.style.height = `${fromRect.height}px`;
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";

    document.body.appendChild(clone);

    // Trigger reflow
    clone.offsetHeight;

    // Animate to target position
    requestAnimationFrame(() => {
      clone.style.left = `${toRect.left}px`;
      clone.style.top = `${toRect.top}px`;
      clone.style.width = `${toRect.width}px`;
      clone.style.height = `${toRect.height}px`;
    });

    // Wait for animation to complete
    await new Promise((resolve) => {
      clone.addEventListener("transitionend", resolve, { once: true });
      setTimeout(resolve, 400); // Fallback timeout
    });

    // Clean up
    document.body.removeChild(clone);
  };

  return (
    <SharedElementTransitionContext.Provider
      value={{
        registerElement,
        unregisterElement,
        getElement,
        transition,
      }}
    >
      {children}
    </SharedElementTransitionContext.Provider>
  );
}

