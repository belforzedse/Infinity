"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
  titleClassName?: string;
  closeIcon?: ReactNode;
  "aria-labelledby"?: string;
};

type MotionPhase = "hidden" | "entering" | "shown" | "exiting";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Portal dialog with backdrop, Escape to close, focus trap, scroll lock.
 * Motion matches storefront `tailwindcss-animate` (`fade-in` + `zoom-in-95`, `duration-200`, default `ease`):
 * same `translate3d` + `scale3d(0.95)` enter keyframe shape, GPU-friendly; exit mirrors `fade-out` / `zoom-out-95`.
 * Phase machine + one `requestAnimationFrame` avoids transition/keyframe jank; `animationend` syncs unmount.
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  title,
  titleClassName = "",
  closeIcon,
  "aria-labelledby": ariaLabelledby,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const prevIsOpenRef = useRef(isOpen);
  const motionPhaseRef = useRef<MotionPhase>("hidden");
  const openRafRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef(false);

  const [domReady, setDomReady] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const [motionPhase, setMotionPhase] = useState<MotionPhase>("hidden");

  useEffect(() => {
    motionPhaseRef.current = motionPhase;
  }, [motionPhase]);

  const generatedTitleId = useId();
  const titleId = title ? generatedTitleId : undefined;
  const labelledById = title ? generatedTitleId : ariaLabelledby;

  const cancelOpenRaf = useCallback(() => {
    if (openRafRef.current !== null) {
      cancelAnimationFrame(openRafRef.current);
      openRafRef.current = null;
    }
  }, []);

  useEffect(() => {
    setDomReady(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mq.matches;
    const onChange = () => {
      prefersReducedMotionRef.current = mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (isOpen) {
      cancelOpenRaf();
      setPortalMounted(true);
      if (prefersReducedMotionRef.current) {
        setMotionPhase("shown");
      } else {
        setMotionPhase("hidden");
        openRafRef.current = requestAnimationFrame(() => {
          openRafRef.current = null;
          setMotionPhase("entering");
        });
      }
      return () => {
        cancelOpenRaf();
      };
    }

    if (wasOpen) {
      if (prefersReducedMotionRef.current) {
        setPortalMounted(false);
        setMotionPhase("hidden");
      } else {
        setMotionPhase("exiting");
      }
    }

    return () => {
      cancelOpenRaf();
    };
  }, [isOpen, cancelOpenRaf]);

  useEffect(() => {
    return () => {
      cancelOpenRaf();
    };
  }, [cancelOpenRaf]);

  const handleDialogAnimationEnd = useCallback((e: ReactAnimationEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const phase = motionPhaseRef.current;
    if (phase === "entering") {
      setMotionPhase("shown");
      return;
    }
    if (phase === "exiting") {
      setPortalMounted(false);
      setMotionPhase("hidden");
    }
  }, []);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    const selectors = [
      "a[href]",
      "area[href]",
      "input:not([disabled]):not([type='hidden'])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      "iframe",
      "object",
      "embed",
      "[contenteditable]",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    return Array.from(modalRef.current.querySelectorAll<HTMLElement>(selectors)).filter(
      (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
    );
  }, []);

  useEffect(() => {
    if (!portalMounted) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [portalMounted]);

  const isInteractive = motionPhase === "shown";

  useEffect(() => {
    if (!portalMounted || !isInteractive) return;
    previousActiveElement.current = document.activeElement as HTMLElement;

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    } else {
      modalRef.current?.focus();
    }
  }, [portalMounted, isInteractive, getFocusableElements]);

  useEffect(() => {
    if (!portalMounted || !isInteractive) return;
    window.addEventListener("keydown", handleEscape);

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusableElements();
      if (focusables.length === 0) {
        e.preventDefault();
        modalRef.current?.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;
      const isWithinModal = !!activeElement && !!modalRef.current?.contains(activeElement);

      if (!isWithinModal) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      if (e.shiftKey) {
        if (activeElement === first || activeElement === modalRef.current) {
          e.preventDefault();
          last.focus();
        }
        return;
      }

      if (activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTabKey);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabKey);
    };
  }, [portalMounted, isInteractive, handleEscape, getFocusableElements]);

  const handleBackdropClick = (e: ReactMouseEvent | ReactKeyboardEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!domReady || !portalMounted) return null;

  const backdropClass = cx(
    "fixed inset-0 z-[1300] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm",
    motionPhase === "hidden" && "opacity-0",
    motionPhase === "entering" && "infinity-modal-backdrop-enter opacity-100",
    motionPhase === "shown" && "opacity-100",
    motionPhase === "exiting" && "infinity-modal-backdrop-exit opacity-100",
  );

  const dialogClass = cx(
    "relative w-full max-w-7xl origin-center rounded-3xl bg-white shadow-2xl [backface-visibility:hidden]",
    motionPhase === "hidden" && "opacity-0 [transform:translate3d(0,0,0)_scale3d(0.95,0.95,1)]",
    motionPhase === "entering" && "infinity-modal-dialog-enter opacity-100 [transform:translate3d(0,0,0)_scale3d(1,1,1)]",
    motionPhase === "shown" && "opacity-100 [transform:translate3d(0,0,0)_scale3d(1,1,1)]",
    motionPhase === "exiting" && "infinity-modal-dialog-exit opacity-100 [transform:translate3d(0,0,0)_scale3d(1,1,1)]",
    className,
  );

  return createPortal(
    <div
      className={backdropClass}
      onClick={handleBackdropClick}
      tabIndex={-1}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={dialogClass}
        tabIndex={-1}
        onAnimationEnd={handleDialogAnimationEnd}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          {title ? (
            <h2 id={titleId} className={`font-peyda text-lg font-bold text-zinc-900 ${titleClassName}`}>
              {title}
            </h2>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className="group flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-50 transition-all hover:bg-zinc-100 active:scale-95"
            aria-label="بستن"
          >
            {closeIcon ?? (
              <svg
                className="h-6 w-6 text-zinc-600 group-hover:text-zinc-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
