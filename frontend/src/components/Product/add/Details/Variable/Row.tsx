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
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="text-sm text-neutral-400">{item.variable}</div>
        </div>
      </td>
      <td className="text-sm border-r border-slate-100 p-4 text-neutral-400">
        <div className="flex flex-col">
          {item.discountPrice && (
            <span className="text-sm text-pink-600 font-medium">
              {item.discountPrice.toLocaleString()} تومان
            </span>
          )}
          <span className={item.discountPrice ? "text-xs text-gray-500 line-through" : "text-sm"}>
            {item.price.toLocaleString()} تومان
          </span>
        </div>
      </td>
      <td className="text-sm border-r border-slate-100 p-4 text-neutral-400">
        {item.stock} عدد در انبار
      </td>
      <td className="text-sm border-r border-slate-100 p-4 text-neutral-400">
        {item.sku}
      </td>
      <td className="border-r border-slate-100 p-4">
        <span
          className={`text-xs inline-block w-full rounded-lg px-4 py-2 text-center ${
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
          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-100"
        >
          ویرایش
        </button>
      </td>
    </tr>
  );
};
