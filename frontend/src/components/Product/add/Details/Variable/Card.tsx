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
    <div className="flex flex-col gap-2 divide-y-[1px] divide-slate-100 rounded-lg border border-slate-100 bg-white p-2">
      {/* Variable Name */}
      <div className="text-sm flex flex-col gap-0.5">
        <span className="text-gray-500">متغیر</span>
        <span className="text-gray-900">{item.variable}</span>
      </div>

      {/* Price */}
      <div className="text-sm flex flex-col gap-0.5 pt-2">
        <span className="text-gray-500">قیمت</span>
        <div className="flex flex-col">
          {item.discountPrice && (
            <span className="text-sm text-pink-600 font-medium">
              {item.discountPrice.toLocaleString()} تومان
            </span>
          )}
          <span className={item.discountPrice ? "text-xs text-gray-500 line-through" : "text-gray-900"}>
            {item.price.toLocaleString()} تومان
          </span>
        </div>
      </div>

      {/* Stock */}
      <div className="text-sm flex flex-col gap-0.5 pt-2">
        <span className="text-gray-500">موجودی</span>
        <span className="text-gray-900">{item.stock} عدد در انبار</span>
      </div>

      {/* SKU */}
      <div className="text-sm flex flex-col gap-0.5 pt-2">
        <span className="text-gray-500">کد محصول</span>
        <span className="text-gray-900">{item.sku}</span>
      </div>

      {/* Status */}
      <div className="text-sm flex flex-col gap-0.5 pt-2">
        <span className="text-gray-500">وضعیت</span>
        <span
          className={clsx(
            "text-sm w-full rounded px-3 py-1 text-center text-white",
            {
              "bg-green-500": item.isPublished,
              "bg-yellow-500": !item.isPublished,
            },
          )}
        >
          {item.isPublished ? "منتشر شده" : "پیش نویس"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-100 pt-2">
        <button
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-slate-100 py-2 text-center text-gray-800"
          onClick={onEdit}
        >
          <span className="text-xs text-slate-500">ویرایش </span>
          <EditIcon className="h-4 w-4" />
        </button>
        <button
          className="w-fit rounded-md bg-slate-100 p-2 text-center text-slate-500"
          onClick={onDelete}
        >
          <DeleteIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
