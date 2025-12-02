import React from "react";

interface ProductVariableHeaderProps {
  showDelete?: boolean;
}

export const ProductVariableHeader: React.FC<ProductVariableHeaderProps> = ({ showDelete = false }) => {
  return (
    <thead className="bg-slate-100">
      <tr>
        <th className="text-sm border-l border-slate-100 p-4 text-right font-medium text-gray-900">
          متغیر
        </th>
        <th className="text-sm border-l border-slate-100 p-4 text-right font-medium text-gray-900">
          قیمت
        </th>
        <th className="text-sm border-l border-slate-100 p-4 text-right font-medium text-gray-900">
          موجودی
        </th>
        <th className="text-sm border-l border-slate-100 p-4 text-right font-medium text-gray-900">
          کد محصول
        </th>
        <th className="text-sm border-l border-slate-100 p-4 text-right font-medium text-gray-900">
          وضعیت
        </th>
        <th className="text-sm p-4 text-right font-medium text-gray-900">عملیات</th>
        {showDelete && (
          <th className="text-sm border-r border-slate-100 p-4 text-right font-medium text-gray-900">
            حذف
          </th>
        )}
      </tr>
    </thead>
  );
};
