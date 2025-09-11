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
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1"
    >
      <span className="text-slate-500">{title}</span>
      <button
        onClick={onDeleteFunction}
        className="rounded-full text-slate-400 hover:bg-gray-100"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export default ProductChip;
