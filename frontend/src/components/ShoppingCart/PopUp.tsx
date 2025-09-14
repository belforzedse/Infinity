"use client";

import React from "react";
import CloseIcon from "../PLP/Icons/CloseIcon";
import Image from "next/image";
import CategoryIcon from "./Icons/CategoryIcon";
import DeleteIcon from "../Product/Icons/DeleteIcon";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function PopUp({ isOpen, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      {/* Popup */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-[321px] transform bg-white transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg text-neutral-800">سبد خرید</h2>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200"
          >
            <CloseIcon className="h-6 w-6 text-pink-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-4 rounded-lg border border-slate-200 p-2">
            <div className="flex gap-3">
              <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-gray-100">
                <Image
                  src="/images/clothes-sm.jpg"
                  alt="Product"
                  className="object-cover"
                  fill
                  sizes="96px"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CategoryIcon className="h-4 w-4 text-neutral-400" />
                    <span className="text-sm text-neutral-400">
                      شال و روسری
                    </span>
                  </div>
                  <button>
                    <DeleteIcon className="h-4 w-4 text-pink-600" />
                  </button>
                </div>
                <span className="text-xs text-neutral-800">
                  شال چهار خونه موهر S00361
                </span>
                <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-1">
                  <span className="text-sm text-neutral-400">۱×</span>
                  <span className="text-sm text-neutral-800">
                    ۳۹۸,۰۰۰ تومان
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between border-t border-slate-200 px-1.5 py-2">
            <span className="text-sm text-base text-neutral-800">جمع جزء:</span>
            <span className="text-sm text-lg text-neutral-800">
              ۳۹۸,۰۰۰ تومان
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-sm w-full rounded-lg bg-slate-200 py-2 text-center text-slate-500"
          >
            مشاهده سبد خرید
          </button>
          <button
            onClick={onClose}
            className="text-sm w-full rounded-lg bg-pink-500 py-2 text-white"
          >
            تسویه حساب
          </button>
        </div>
      </div>
    </>
  );
}

export default PopUp;
