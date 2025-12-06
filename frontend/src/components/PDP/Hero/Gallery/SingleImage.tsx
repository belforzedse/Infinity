"use client";

import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import NavigationButtons from "../../NavigationButtons";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
  type WheelEvent,
} from "react";
import { useDrag } from "@use-gesture/react";
import { hapticNavigation } from "@/utils/haptics";

type Props = {
  type: "video" | "image";
  src: string;
  thumb?: string;
  alt?: string;
  goToNextImage: () => void;
  goToPreviousImage: () => void;
};

export default function PDPHeroGallerySingleImage(props: Props) {
  const { type, src, thumb, alt, goToNextImage, goToPreviousImage } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [broken, setBroken] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [transformOrigin, setTransformOrigin] = useState("50% 50%");
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });
  const [zoomHintVisible, setZoomHintVisible] = useState(false);
  const hintTimerRef = useRef<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const lastTapRef = useRef<number>(0);
  const pinchState = useRef<{ active: boolean; startDistance: number; startScale: number }>({
    active: false,
    startDistance: 0,
    startScale: 1,
  });

  const isDesktopZoom = () => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1024;
  };

  const clampScale = (value: number) => Math.min(Math.max(1, value), 2.75);
  const clampTranslate = (value: number, max: number) => Math.max(Math.min(value, max), -max);

  const getTranslateLimits = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const extraX = Math.max((zoomScale - 1) * rect.width * 0.5, 0);
    const extraY = Math.max((zoomScale - 1) * rect.height * 0.5, 0);
    return { x: extraX, y: extraY };
  };

  const updateOrigin = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setTransformOrigin(`${x}% ${y}%`);
  };

  const scheduleHintHide = () => {
    if (hintTimerRef.current) {
      window.clearTimeout(hintTimerRef.current);
    }

    hintTimerRef.current = window.setTimeout(() => {
      setZoomHintVisible(false);
      hintTimerRef.current = null;
    }, 3200);
  };

  const showHint = () => {
    if (!isDesktopZoom() || type === "video") return;
    setZoomHintVisible(true);
    scheduleHintHide();
  };

  const clampToBounds = () => {
    const limits = getTranslateLimits();
    setTranslate((current) => ({
      x: clampTranslate(current.x, limits.x),
      y: clampTranslate(current.y, limits.y),
    }));
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (type === "video" || !isDesktopZoom()) return;
    const direction = Math.sign(event.deltaY) || 1;
    const zoomDelta = direction > 0 ? -0.12 : 0.12;
    const next = clampScale(zoomScale + zoomDelta);

    if (next === zoomScale) {
      if (zoomScale > 1) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setZoomHintVisible(false);
    updateOrigin(event.clientX, event.clientY);
    setZoomScale(next);
    if (next === 1) {
      setTranslate({ x: 0, y: 0 });
    } else {
      clampToBounds();
    }
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (type === "video") return;

    if (dragState.current.active) {
      const limits = getTranslateLimits();
      const deltaX = event.clientX - dragState.current.startX;
      const deltaY = event.clientY - dragState.current.startY;
      const nextX = clampTranslate(dragState.current.baseX + deltaX, limits.x);
      const nextY = clampTranslate(dragState.current.baseY + deltaY, limits.y);
      setTranslate({ x: nextX, y: nextY });
      return;
    }

    if (zoomScale <= 1) return;
    updateOrigin(event.clientX, event.clientY);
  };

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (type === "video" || zoomScale <= 1) return;
    dragState.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      baseX: translate.x,
      baseY: translate.y,
    };
    event.preventDefault();
  };

  const handleMouseUp = () => {
    dragState.current.active = false;
  };

  const handleMouseLeave = () => {
    dragState.current.active = false;
    if (zoomScale === 1) {
      setZoomHintVisible(false);
      return;
    }
    setZoomScale(1);
    setTransformOrigin("50% 50%");
    setTranslate({ x: 0, y: 0 });
    setZoomHintVisible(false);
  };

  const handleMouseEnter = () => {
    showHint();
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mq.matches);
      const handler = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
      if (mq.addEventListener) mq.addEventListener("change", handler);
      else mq.addListener(handler);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener("change", handler);
        else mq.removeListener(handler);
      };
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const stopDrag = () => {
      dragState.current.active = false;
    };
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mouseup", stopDrag);
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setBroken(false);
  }, [src, type]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextImage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPreviousImage();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goToNextImage, goToPreviousImage]);

  // Swipe gesture for mobile navigation
  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      if (pinchState.current.active) return;
      // Only handle horizontal swipes on mobile
      if (typeof window === "undefined" || window.innerWidth >= 1024) return;

      // Determine swipe threshold (30px or high velocity)
      const swipeThreshold = 30;
      const velocityThreshold = 0.5;

      if (!active && (Math.abs(mx) > swipeThreshold || Math.abs(vx) > velocityThreshold)) {
        if (xDir > 0) {
          // Swipe right (RTL: go to previous)
          hapticNavigation();
          goToPreviousImage();
        } else if (xDir < 0) {
          // Swipe left (RTL: go to next)
          hapticNavigation();
          goToNextImage();
        }
      }
    },
    {
      axis: "x",
      threshold: 10,
      preventDefault: true,
    },
  );

  const distanceBetweenTouches = (touches: TouchList) => {
    const [a, b] = [touches[0], touches[1]];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    if (event.touches.length === 2) {
      pinchState.current = {
        active: true,
        startDistance: distanceBetweenTouches(event.touches),
        startScale: zoomScale,
      };
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    if (pinchState.current.active && event.touches.length === 2) {
      const newDistance = distanceBetweenTouches(event.touches);
      const scaleFactor = newDistance / pinchState.current.startDistance;
      const nextScale = clampScale(pinchState.current.startScale * scaleFactor);
      setZoomScale(nextScale);

      // Recenter on pinch midpoint
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        updateOrigin(midX, midY);
      }
      event.preventDefault();
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (pinchState.current.active && event.touches.length < 2) {
      pinchState.current.active = false;
    }

    if (prefersReducedMotion) return;

    // Double-tap to toggle zoom on mobile
    if (event.touches.length === 0 && event.changedTouches.length === 1 && !isDesktopZoom()) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        const touch = event.changedTouches[0];
        updateOrigin(touch.clientX, touch.clientY);
        const targetScale = zoomScale > 1 ? 1 : 2;
        setZoomScale(targetScale);
        if (targetScale === 1) {
          setTranslate({ x: 0, y: 0 });
        }
        event.preventDefault();
      }
      lastTapRef.current = now;
    }
  };

  return (
    <div className="h-full flex-1">
      <div
        ref={containerRef}
        className="relative h-[70vw] max-h-[560px] w-full overflow-hidden rounded-3xl sm:h-[460px] md:h-[520px]"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...bind()}
      >
        {type === "video" ? (
          <video
            className={`h-full w-full object-contain transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            src={src}
            controls
            loop
            onCanPlay={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            poster={thumb}
          />
        ) : (
          <div className="absolute inset-0">
            <div
              className="relative h-full w-full transition-transform duration-200 ease-out"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px)`,
              }}
            >
              <div
                className="relative h-full w-full transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin,
                }}
              >
                <Image
                  className={`h-full w-full object-cover transition-opacity duration-300 ease-out ${
                    isLoading ? "opacity-0 blur-[2px]" : "opacity-100"
                  }`}
                  src={broken ? "/images/placeholders/image-placeholder.svg" : src}
                  alt={alt || ""}
                  fill
                  loader={imageLoader}
                  sizes="(max-width: 768px) 100vw, 640px"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setBroken(true);
                    setIsLoading(false);
                  }}
                  priority={false}
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjY0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
                />
              </div>
            </div>
          </div>
        )}

        {zoomHintVisible && (
          <div className="pointer-events-none absolute bottom-4 left-4 z-30 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-pink-600 shadow-lg shadow-gray-200">
            {zoomScale > 1 ? "اسکرول پایین برای خارج شدن از زوم" : "اسکرول بالا برای زوم کردن"}
          </div>
        )}

        {isLoading && thumb ? (
          <div
            className="absolute inset-0 z-0 scale-105 blur-xl transition-opacity duration-300"
            style={{
              backgroundImage: `url(${thumb})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.6,
            }}
          />
        ) : null}

        {isLoading && !thumb ? (
          <div className="absolute inset-0 z-0 animate-pulse bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100" />
        ) : null}

        <div className="absolute bottom-3 left-[50%] z-10 translate-x-[-50%]">
          <NavigationButtons goToNextImage={goToNextImage} goToPreviousImage={goToPreviousImage} />
        </div>
      </div>
    </div>
  );
}
