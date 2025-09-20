"use client";

import { useState } from "react";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import EyeIcon from "@/components/SuperAdmin/Layout/Icons/EyeIcon";
import AnipoBarcodeDialog from "./AnipoBarcodeDialog";

interface OrderRowActionsProps {
  orderId: string;
  shippingBarcode?: string;
}

export default function OrderRowActions({ orderId, shippingBarcode }: OrderRowActionsProps) {
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasBarcode, setHasBarcode] = useState(!!shippingBarcode);

  const handlePrintReceipt = () => {
    const url = `/super-admin/orders/print/${orderId}`;
    window.open(url, "_blank");
  };

  const handleGenerateBarcode = async (weight?: number, boxSizeId?: number) => {
    setIsGenerating(true);
    try {
      const mod = await import("@/services/order");
      const res = await mod.default.generateAnipoBarcode(parseInt(orderId), weight, boxSizeId);

      if (res?.success || res?.already) {
        setHasBarcode(true);
        alert(
          res?.already
            ? "بارکد قبلاً ثبت شده است"
            : "بارکد با موفقیت ایجاد شد"
        );
      } else {
        alert("درخواست ارسال شد");
      }

      setShowBarcodeDialog(false);
    } catch (e) {
      alert("خطا در ایجاد بارکد Anipo");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintBarcode = () => {
    // Placeholder for print barcode functionality
    alert("قابلیت پرینت بارکد در حال توسعه است");
  };

  return (
    <>
      <div className="flex flex-row-reverse items-center gap-2 p-1">
        {/* View Order Button */}
        <SuperAdminTableCellActionButton
          variant="secondary"
          path={`/super-admin/orders/edit/${orderId}`}
          icon={<EyeIcon />}
        />

        {/* Print Receipt Button */}
        <button
          onClick={handlePrintReceipt}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
          title="پرینت فاکتور"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 6,2 18,2 18,9"></polyline>
            <path d="m6,18 h12"></path>
            <path d="m6,14 h12 v4 h-12 z"></path>
          </svg>
        </button>

        {/* Anipo Barcode Button */}
        {hasBarcode ? (
          <button
            onClick={handlePrintBarcode}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-green-50 text-green-600 transition-colors hover:bg-green-100"
            title="پرینت بارکد"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5V19H21V5H3Z"></path>
              <path d="M7 8V16"></path>
              <path d="M11 8V16"></path>
              <path d="M15 8V16"></path>
              <path d="M9 8V16"></path>
              <path d="M13 8V16"></path>
              <path d="M17 8V16"></path>
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setShowBarcodeDialog(true)}
            disabled={isGenerating}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-50 text-orange-600 transition-colors hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="صدور بارکد"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5V19H21V5H3Z"></path>
              <path d="M12 8V16"></path>
              <path d="M8 12H16"></path>
            </svg>
          </button>
        )}
      </div>

      <AnipoBarcodeDialog
        isOpen={showBarcodeDialog}
        onClose={() => setShowBarcodeDialog(false)}
        onGenerate={handleGenerateBarcode}
        loading={isGenerating}
      />
    </>
  );
}