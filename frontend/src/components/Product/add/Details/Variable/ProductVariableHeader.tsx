import React from "react";

export const ProductVariableHeader: React.FC = () => {
  return (
    <thead className="border-b border-slate-100">
      <tr>
        <th className="p-4 text-right text-neutral-400 font-normal">متغیر</th>
        <th className="p-4 text-right text-neutral-400 border-r border-slate-100 font-normal">
          قیمت
        </th>
        <th className="p-4 text-right text-neutral-400 border-r border-slate-100 font-normal">
          موجودی
        </th>
        <th className="p-4 text-right text-neutral-400 border-r border-slate-100 font-normal">
          SKU
        </th>
        <th className="p-4 text-right text-neutral-400 border-r border-slate-100 w-32 font-normal">
          وضعیت
        </th>
      </tr>
    </thead>
  );
};
