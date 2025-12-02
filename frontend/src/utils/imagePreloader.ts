/**
 * Image preloader utility to preload images for better performance
 */

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
