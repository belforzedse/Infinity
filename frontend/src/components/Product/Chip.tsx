import React from "react";
import CloseIcon from "../PLP/Icons/CloseIcon";

interface Props {
  onDeleteFunction: () => void;
  title: string;
}

function ProductChip({ onDeleteFunction, title }: Props) {
  return (
    <div
      key={title}
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg"
    >
      <span className="text-slate-500">{title}</span>
      <button
        onClick={onDeleteFunction}
        className="hover:bg-gray-100 rounded-full text-slate-400"
      >
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

export default ProductChip;
