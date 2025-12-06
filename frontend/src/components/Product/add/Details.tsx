"use client";

import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { useAtom } from "jotai";
import { editProductDataAtom, productDataAtom } from "@/atoms/super-admin/products";

interface DetailsProps {
  isEditMode?: boolean;
}

export default function ProductDetails({ isEditMode = false }: DetailsProps) {
  const [productAtom, setProductAtom] = useAtom(isEditMode ? editProductDataAtom : productDataAtom);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "name") {
      setProductAtom({ ...(productAtom as any), Title: value });
    } else if (name === "weight") {
      setProductAtom({ ...(productAtom as any), Weight: value ? Number(value) : 100 });
    } else {
      setProductAtom({ ...(productAtom as any), Description: value });
    }
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
        <Textarea
          name="description"
          value={productAtom.Description}
          onChange={handleChange}
          placeholder="توضیحات محصول"
          className="min-h-[150px] w-full resize-none pt-2 text-right text-neutral-800 placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
