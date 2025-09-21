"use client";

import Modal from "@/components/Kits/Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

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
      <div className="flex flex-col gap-6">
        {description ? (
          <p className="text-smtext-sm text-right text-neutral-600">{description}</p>
        ) : null}

        <div className="flex items-center justify-start gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-actions-primary px-5 py-2.5 text-white hover:brightness-110"
          >
            {confirmText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-neutral-700 hover:bg-slate-50"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
