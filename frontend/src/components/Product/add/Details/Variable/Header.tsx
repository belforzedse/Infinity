import React from "react";

export const ProductVariableHeader: React.FC = () => {
  return (
    <thead className="bg-slate-100">
      <tr>
        <th className="p-4 text-right text-sm font-medium text-gray-900 border-l border-slate-100">
          متغیر
        </th>
        <th className="p-4 text-right text-sm font-medium text-gray-900 border-l border-slate-100">
          قیمت
        </th>
        <th className="p-4 text-right text-sm font-medium text-gray-900 border-l border-slate-100">
          موجودی
        </th>
        <th className="p-4 text-right text-sm font-medium text-gray-900 border-l border-slate-100">
          کد محصول
        </th>
        <th className="p-4 text-right text-sm font-medium text-gray-900 border-l border-slate-100">
          وضعیت
        </th>
        <th className="p-4 text-right text-sm font-medium text-gray-900">
          عملیات
        </th>
      </tr>
    </thead>
  );
};
