"use client";

import Modal from "@/components/Kits/Modal";

export type ConfirmDialogProps = {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirmation step inside [`Modal`](./Modal.tsx). Copy aligned with storefront account sidebar logout.
 */
export default function ConfirmDialog({
  isOpen,
  title = "تایید عملیات",
  description,
  confirmText = "تایید",
  cancelText = "انصراف",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} className="max-w-md">
      <div className="flex flex-col gap-6" dir="rtl">
        {description ? <p className="font-peyda text-right text-sm text-zinc-600">{description}</p> : null}

        <div className="flex flex-row flex-wrap items-center justify-start gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="pressable cursor-pointer rounded-2xl bg-infinity-primary px-5 py-2.5 font-peyda text-sm font-medium text-white transition-colors hover:opacity-95 active:bg-[#2f3b56] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70"
          >
            {confirmText}
          </button>
          {cancelText ? (
            <button
              type="button"
              onClick={onCancel}
              className="pressable cursor-pointer rounded-2xl border border-zinc-200 bg-white px-5 py-2.5 font-peyda text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70"
            >
              {cancelText}
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
