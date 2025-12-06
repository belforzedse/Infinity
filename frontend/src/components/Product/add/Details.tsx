"use client";

import { Input } from "@/components/ui/Input";
import { useAtom } from "jotai";
import { editProductDataAtom, productDataAtom } from "@/atoms/super-admin/products";
import dynamic from "next/dynamic";

// Lazy load RichTextEditor to reduce initial bundle size (saves ~150KB)
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] w-full animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
  ),
});

interface DetailsProps {
  isEditMode?: boolean;
}

export default function ProductDetails({ isEditMode = false }: DetailsProps) {
  const [productAtom, setProductAtom] = useAtom(isEditMode ? editProductDataAtom : productDataAtom);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "name") {
      setProductAtom({ ...(productAtom as any), Title: value });
    } else if (name === "weight") {
      setProductAtom({ ...(productAtom as any), Weight: value ? Number(value) : 100 });
    }
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
