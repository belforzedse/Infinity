import React from "react";

export const ProductVariableHeader: React.FC = () => {
  return (
    <thead className="border-b border-slate-100">
      <tr>
        <th className="p-4 text-right font-normal text-neutral-400">متغیر</th>
        <th className="border-r border-slate-100 p-4 text-right font-normal text-neutral-400">
          قیمت
        </th>
        <th className="border-r border-slate-100 p-4 text-right font-normal text-neutral-400">
          موجودی
        </th>
        <th className="border-r border-slate-100 p-4 text-right font-normal text-neutral-400">
          SKU
        </th>
        <th className="w-32 border-r border-slate-100 p-4 text-right font-normal text-neutral-400">
          وضعیت
        </th>
      </tr>
    </thead>
  );
};
