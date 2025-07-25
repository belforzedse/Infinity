import React from "react";
import classNames from "classnames";
import { ProductVariableDisplay } from "./types";

interface ProductVariableRowProps {
  item: ProductVariableDisplay;
  isLast: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
}

export const ProductVariableRow: React.FC<ProductVariableRowProps> = ({
  item,
  isLast,
  isSelected,
  onSelect,
  onEdit,
}) => {
  return (
    <tr className={classNames("border-slate-100", !isLast && "border-b")}>
      <td className="p-4">
        <div className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(item.id)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div className="text-sm text-neutral-400">{item.variable}</div>
        </div>
      </td>
      <td className="p-4 text-neutral-400 border-r border-slate-100 text-sm">
        {item.price.toLocaleString()} تومان
      </td>
      <td className="p-4 text-neutral-400 border-r border-slate-100 text-sm">
        {item.stock} عدد در انبار
      </td>
      <td className="p-4 text-neutral-400 border-r border-slate-100 text-sm">
        {item.sku}
      </td>
      <td className="p-4 border-r border-slate-100">
        <span
          className={`inline-block px-4 py-2 rounded-lg text-xs w-full text-center ${
            item.isPublished
              ? "bg-green-500 text-white"
              : "bg-yellow-500 text-white"
          }`}
        >
          {item.isPublished ? "منتشر شده" : "پیش نویس"}
        </span>
      </td>
      <td className="p-4">
        <button
          onClick={() => onEdit(item.id)}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          ویرایش
        </button>
      </td>
    </tr>
  );
};
