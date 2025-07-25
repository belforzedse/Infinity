"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAtom } from "jotai";
import {
  editProductDataAtom,
  productDataAtom,
} from "@/atoms/super-admin/products";

interface DetailsProps {
  isEditMode?: boolean;
}

export default function ProductDetails({ isEditMode = false }: DetailsProps) {
  const [productAtom, setProductAtom] = useAtom(
    isEditMode ? editProductDataAtom : productDataAtom
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "name") {
      setProductAtom({ ...(productAtom as any), Title: value });
    } else {
      setProductAtom({ ...(productAtom as any), Description: value });
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 bg-white p-5 rounded-xl">
      <div className="flex flex-col lg:gap-4 gap-3">
        <label className="text-base text-gray-700">نام محصول</label>
        <Input
          type="text"
          name="name"
          value={productAtom.Title}
          onChange={handleChange}
          placeholder="نام محصول"
          className="w-full text-right placeholder:text-gray-400 text-neutral-800"
        />
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-base text-gray-700">توضیحات محصول</label>
        <Textarea
          name="description"
          value={productAtom.Description}
          onChange={handleChange}
          placeholder="توضیحات محصول"
          className="min-h-[150px] w-full text-right placeholder:text-gray-400 pt-2 resize-none text-neutral-800"
        />
      </div>
    </div>
  );
}
