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
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Popup */}
      <div
        className={`fixed top-0 left-0 h-full w-[321px] bg-white z-50 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg text-neutral-800">سبد خرید</h2>

          <button
            onClick={onClose}
            className="border border-slate-200 rounded-full flex justify-center items-center w-8 h-8"
          >
            <CloseIcon className="w-6 h-6 text-pink-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 border border-slate-200 mx-4 rounded-lg">
            <div className="flex gap-3">
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
                <Image
                  src="/images/clothes-sm.jpg"
                  alt="Product"
                  className="object-cover"
                  fill
                />
              </div>
              <div className="flex flex-col justify-between flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CategoryIcon className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-400">
                      شال و روسری
                    </span>
                  </div>
                  <button>
                    <DeleteIcon className="w-4 h-4 text-pink-600" />
                  </button>
                </div>
                <span className="text-xs text-neutral-800">
                  شال چهار خونه موهر S00361
                </span>
                <div className="bg-slate-100 py-1 px-3 rounded-lg flex items-center justify-between">
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
        <div className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center py-2 px-1.5 border-t border-slate-200">
            <span className="text-sm text-neutral-800 text-base">جمع جزء:</span>
            <span className="text-sm text-neutral-800 text-lg">
              ۳۹۸,۰۰۰ تومان
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full text-center py-2 text-sm text-slate-500 bg-slate-200 rounded-lg"
          >
            مشاهده سبد خرید
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 bg-pink-500 text-white rounded-lg text-sm"
          >
            تسویه حساب
          </button>
        </div>
      </div>
    </>
  );
}

export default PopUp;
