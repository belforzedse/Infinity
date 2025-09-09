import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ReactNode } from "react";
import DeleteIcon from "./Icons/DeleteIcon";
import classNames from "classnames";

interface Props {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeIcon?: ReactNode;
  titleClassName?: string;
}

export default function Modal({
  isOpen,
  title,
  onClose,
  children,
  className = "",
  closeIcon,
  titleClassName,
}: Props) {
  return (
    <Dialog open={isOpen} onClose={onClose} as="div" className="relative z-[1200]">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            className={`w-full max-w-2xl transform rounded-2xl bg-white p-5 shadow-xl transition-all lg:px-10 lg:py-7 ${className}`}
          >
            <DialogTitle
              className={classNames(
                "mb-3 flex items-center justify-between lg:mb-4",
                titleClassName,
              )}
            >
              {title ? (
                <span className="text-2xl text-neutral-700">{title}</span>
              ) : null}

              {closeIcon ? (
                <button onClick={onClose}>{closeIcon}</button>
              ) : (
                <button
                  onClick={onClose}
                  className="rounded-full border border-slate-200 p-1.5 text-neutral-800"
                  aria-label="بستن"
                >
                  <DeleteIcon />
                </button>
              )}
            </DialogTitle>

            {children}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
