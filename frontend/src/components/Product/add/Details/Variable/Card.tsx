import DeleteIcon from "@/components/Product/Icons/DeleteIcon";
import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import clsx from "clsx";
import React from "react";
import { ProductVariableDisplay } from "./types";

interface ProductVariableCardProps {
  item: ProductVariableDisplay;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductVariableCard: React.FC<ProductVariableCardProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex flex-col gap-2 bg-white p-2 border border-slate-100 rounded-lg divide-y-[1px] divide-slate-100">
      {/* Variable Name */}
      <div className="flex flex-col text-sm gap-0.5">
        <span className="text-gray-500">متغیر</span>
        <span className="text-gray-900">{item.variable}</span>
      </div>

      {/* Price */}
      <div className="flex flex-col text-sm gap-0.5 pt-2">
        <span className="text-gray-500">قیمت</span>
        <span className="text-gray-900">
          {item.price.toLocaleString()} تومان
        </span>
      </div>

      {/* Stock */}
      <div className="flex flex-col text-sm gap-0.5 pt-2">
        <span className="text-gray-500">موجودی</span>
        <span className="text-gray-900">{item.stock} عدد در انبار</span>
      </div>

      {/* SKU */}
      <div className="flex flex-col text-sm gap-0.5 pt-2">
        <span className="text-gray-500">کد محصول</span>
        <span className="text-gray-900">{item.sku}</span>
      </div>

      {/* Status */}
      <div className="flex flex-col text-sm gap-0.5 pt-2">
        <span className="text-gray-500">وضعیت</span>
        <span
          className={clsx(
            "px-3 py-1 rounded w-full text-center text-sm text-white",
            {
              "bg-green-500": item.isPublished,
              "bg-yellow-500": !item.isPublished,
            }
          )}
        >
          {item.isPublished ? "منتشر شده" : "پیش نویس"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          className="flex-1 text-center py-2 flex gap-1 bg-slate-100 justify-center items-center rounded-md text-gray-800"
          onClick={onEdit}
        >
          <span className="text-xs text-slate-500">ویرایش </span>
          <EditIcon className="w-4 h-4" />
        </button>
        <button
          className="text-center bg-slate-100 p-2 w-fit rounded-md text-slate-500"
          onClick={onDelete}
        >
          <DeleteIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
