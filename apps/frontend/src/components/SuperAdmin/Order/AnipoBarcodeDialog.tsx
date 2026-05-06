"use client";

import Modal from "@/components/Kits/Modal";
import { useState } from "react";

interface AnipoBarcodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (weight?: number, boxSizeId?: number) => Promise<void>;
  loading?: boolean;
}

export default function AnipoBarcodeDialog({
  isOpen,
  onClose,
  onGenerate,
  loading = false,
}: AnipoBarcodeDialogProps) {
  const [customWeight, setCustomWeight] = useState("");
  const [customBoxSize, setCustomBoxSize] = useState("3");

  const handleGenerate = async () => {
    const weight = customWeight ? parseInt(customWeight) : undefined;
    const boxSize = customBoxSize ? parseInt(customBoxSize) : undefined;
    await onGenerate(weight, boxSize);
  };

  const handleClose = () => {
    setCustomWeight("");
    setCustomBoxSize("3");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="صدور بارکد Anipo" className="max-w-md">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">وزن (گرم)</label>
            <input
              type="number"
              placeholder="100"
              value={customWeight}
              onChange={(e) => setCustomWeight(e.target.value)}
              className="text-sm rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">سایز جعبه</label>
            <select
              value={customBoxSize}
              onChange={(e) => setCustomBoxSize(e.target.value)}
              className="text-sm rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="1">سایز ۱ (100×100×150)</option>
              <option value="2">سایز ۲ (100×150×200)</option>
              <option value="3">سایز ۳ (150×200×200)</option>
              <option value="4">سایز ۴ (200×200×300)</option>
              <option value="5">سایز ۵ (350×250×200)</option>
              <option value="6">سایز ۶ (200×250×450)</option>
              <option value="7">سایز ۷ (250×300×400)</option>
              <option value="8">سایز ۸ (300×400×450)</option>
              <option value="9">سایز ۹ (350×450×550)</option>
              <option value="10">سایز ۱۰ (ابعاد بزرگتر)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-start gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-xl bg-actions-primary px-5 py-2.5 text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "در حال ایجاد..." : "ایجاد بارکد"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-neutral-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            انصراف
          </button>
        </div>
      </div>
    </Modal>
  );
}
