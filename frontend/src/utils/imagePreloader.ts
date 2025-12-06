/**
 * Image preloader utility to preload images for better performance
 * Enhanced with Intersection Observer for progressive loading
 */

import { useEffect, RefObject } from "react";

interface PreloadOptions {
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

/**
 * Preload a single image
 */
export const preloadImage = (src: string, options: PreloadOptions = {}) => {
  if (typeof window === "undefined") return;

  const {
    priority = false,
    sizes: _sizes = "(max-width: 768px) 100vw, 50vw",
    quality: _quality = 75,
  } = options;

  // Create a link element for preloading
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;

  if (priority) {
    link.setAttribute("importance", "high");
  }

  // Add to document head
  document.head.appendChild(link);

  // Optional: Remove after load to clean up DOM
  link.onload = () => {
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    }, 1000);
  };
};

/**
 * Preload multiple images
 */
export const preloadImages = (sources: string[], options: PreloadOptions = {}) => {
  sources.forEach((src, index) => {
    preloadImage(src, {
      ...options,
      priority: options.priority && index < 3, // Only prioritize first 3 images
    });
  });
};

/**
 * Preload images on hover for better UX
 */
export const preloadOnHover = (element: HTMLElement, imageSrc: string) => {
  if (typeof window === "undefined") return;

  const handleMouseEnter = () => {
    preloadImage(imageSrc, { priority: true });
    element.removeEventListener("mouseenter", handleMouseEnter);
  };

  element.addEventListener("mouseenter", handleMouseEnter, { once: true });
};

/**
 * Preload images when they enter the viewport using Intersection Observer
 * @param ref - React ref to the element to observe
 * @param imageSrc - Image source to preload
 * @param options - Preload options
 */
export const usePreloadOnIntersect = (
  ref: RefObject<HTMLElement>,
  imageSrc: string | string[],
  options: PreloadOptions & { rootMargin?: string } = {},
) => {
  useEffect(() => {
    if (typeof window === "undefined" || !ref.current) return;

    const sources = Array.isArray(imageSrc) ? imageSrc : [imageSrc];
    const { rootMargin = "200px", ...preloadOptions } = options;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            sources.forEach((src) => {
              preloadImage(src, preloadOptions);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin,
        threshold: 0.1,
      },
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, imageSrc, options]);
};
