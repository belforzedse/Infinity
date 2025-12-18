// components/Kits/Modal.tsx - Add these enhancements

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleClassName?: string;
  closeIcon?: React.ReactNode;
  "aria-labelledby"?: string;
}

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

  // Focus trap and management
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus modal
      modalRef.current?.focus();

      // Lock body scroll
      document.body.style.overflow = "hidden";

      return () => {
        // Restore focus
        previousActiveElement.current?.focus();

        // Unlock body scroll
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledby}
    >
      <div
        ref={modalRef}
        className={`relative w-full max-w-7xl rounded-3xl bg-white shadow-2xl duration-200 animate-in zoom-in-95 ${className}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          {title && (
            <h3 className={`text-lg font-bold text-gray-900 ${titleClassName}`}>
              {title}
            </h3>
          )}
          
          <button
            onClick={onClose}
            className="group flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 transition-all hover:bg-gray-100 active:scale-95"
            aria-label="بستن"
          >
            {closeIcon || (
              <svg
                className="h-6 w-6 text-gray-600 group-hover:text-gray-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
