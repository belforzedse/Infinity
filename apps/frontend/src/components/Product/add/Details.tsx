"use client";

import { Input } from "@/components/ui/Input";
import { useAtom } from "jotai";
import { editProductDataAtom, productDataAtom } from "@/atoms/super-admin/products";
import RichTextEditor from "@/components/RichTextEditor";

interface DetailsProps {
  isEditMode?: boolean;
}

export default function ProductDetails({ isEditMode = false }: DetailsProps) {
  const [productAtom, setProductAtom] = useAtom(isEditMode ? editProductDataAtom : productDataAtom);
  const isSimpleProduct = productAtom.ProductType === "Simple";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    if (name === "name") {
      setProductAtom({ ...(productAtom as any), Title: value });
    } else if (name === "weight") {
      setProductAtom({ ...(productAtom as any), Weight: value ? Number(value) : 100 });
    } else if (name === "simpleIsPublished") {
      setProductAtom({ ...(productAtom as any), SimpleIsPublished: checked });
    } else if (name === "simpleSKU") {
      setProductAtom({ ...(productAtom as any), SimpleSKU: value });
    } else if (name === "simplePrice") {
      setProductAtom({ ...(productAtom as any), SimplePrice: value ? Number(value) : 0 });
    } else if (name === "simpleDiscountPrice") {
      setProductAtom({
        ...(productAtom as any),
        SimpleDiscountPrice: value ? Number(value) : null,
      });
    } else if (name === "simpleStock") {
      setProductAtom({ ...(productAtom as any), SimpleStock: value ? Number(value) : 0 });
    }
  };

  const setProductType = (ProductType: "Variable" | "Simple") => {
    setProductAtom({
      ...(productAtom as any),
      ProductType,
      IsSimpleProduct: ProductType === "Simple",
    });
  };

  const handleDescriptionChange = (content: string) => {
    setProductAtom({ ...(productAtom as any), Description: content });
  };

  return (
    <div className="flex w-full flex-col gap-6 rounded-xl bg-white p-5">
      <div className="flex flex-col gap-3 lg:gap-4">
        <label className="text-base text-gray-700">نام محصول</label>
        <Input
          type="text"
          name="name"
          value={productAtom.Title}
          onChange={handleChange}
          placeholder="نام محصول"
          className="w-full text-right text-neutral-800 placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-3 lg:gap-4">
        <label className="text-base text-gray-700">وزن محصول (گرم)</label>
        <Input
          type="number"
          name="weight"
          value={productAtom.Weight ?? 100}
          onChange={handleChange}
          placeholder="وزن محصول به گرم"
          min="0"
          className="w-full text-right text-neutral-800 placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-col gap-3 lg:gap-4">
        <label className="text-base text-gray-700">نوع محصول</label>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setProductType("Variable")}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              !isSimpleProduct
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:bg-white/70"
            }`}
          >
            متغیر
          </button>
          <button
            type="button"
            onClick={() => setProductType("Simple")}
            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
              isSimpleProduct
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:bg-white/70"
            }`}
          >
            ساده
          </button>
        </div>
      </div>

      {isSimpleProduct && (
        <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700">کد محصول (SKU)</label>
            <Input
              type="text"
              name="simpleSKU"
              value={productAtom.SimpleSKU || ""}
              onChange={handleChange}
              placeholder="در صورت خالی بودن خودکار ساخته می‌شود"
              className="w-full text-right text-neutral-800 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700">قیمت اصلی (تومان)</label>
            <Input
              type="number"
              name="simplePrice"
              value={productAtom.SimplePrice ?? 0}
              onChange={handleChange}
              min="0"
              className="w-full text-right text-neutral-800 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700">قیمت تخفیف‌خورده (تومان)</label>
            <Input
              type="number"
              name="simpleDiscountPrice"
              value={productAtom.SimpleDiscountPrice ?? ""}
              onChange={handleChange}
              min="0"
              placeholder="بدون تخفیف"
              className="w-full text-right text-neutral-800 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700">موجودی</label>
            <Input
              type="number"
              name="simpleStock"
              value={productAtom.SimpleStock ?? 0}
              onChange={handleChange}
              min="0"
              max="1000"
              className="w-full text-right text-neutral-800 placeholder:text-gray-400"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="simpleIsPublished"
              checked={productAtom.SimpleIsPublished !== false}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            انتشار محصول ساده
          </label>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <label className="text-base text-gray-700">توضیحات محصول</label>
        <RichTextEditor
          content={productAtom.Description || ""}
          onChange={handleDescriptionChange}
          placeholder="توضیحات محصول"
          simplified={true}
        />
      </div>
    </div>
  );
}
