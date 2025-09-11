"use client";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ProductSizeHelper } from "@/services/product/product";
import SpecTable from "../SpecTable";

type Props = {
  open: boolean;
  onClose: () => void;
  sizeHelper?: ProductSizeHelper | null;
};

export default function PDPHeroSizeModal(props: Props) {
  const { open, onClose, sizeHelper } = props;

  // Extract size helper data if available
  const sizeHelperData = sizeHelper?.attributes?.Helper || [];

  return (
    <Dialog open={open} onClose={onClose} as="div" className="relative z-[1200]">
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            className={`w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-5 shadow-xl transition-all lg:px-10 lg:py-7`}
          >
            <DialogTitle className="mb-3 lg:mb-4">
              <span className="text-base text-foreground-primary">
                راهنمای سایز
              </span>
            </DialogTitle>

            <SpecTable specs={sizeHelperData} />
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
