"use client";
import SetDetails from "@/components/Product/add/SetCategory/SetCategory";
import Overall from "@/components/Product/add/Overall";
import IndexPhotoUploader from "@/components/Product/add/IndexPhotoUploader";
import { useEffect } from "react";
import { useProductCategory } from "@/hooks/product/useCategory";
import { productDataAtom } from "@/atoms/super-admin/products";
import { useAtomValue } from "jotai";
import { createProduct } from "@/services/super-admin/product/create";
import { useRouter } from "next/navigation";

// Define the type for the API response
interface ProductApiResponse {
  success: boolean;
  data?: {
    data: {
      id: number;
      [key: string]: any;
    };
  };
  error?: any;
}

export default function AddProductsPage() {
  const { fetchAllCategories } = useProductCategory();
  const productData = useAtomValue(productDataAtom);
  const router = useRouter();
  console.log("productData", productData);
  useEffect(() => {
    fetchAllCategories();
  }, []);

  const handleCreateProduct = async () => {
    try {
      const result = (await createProduct(productData)) as ProductApiResponse;
      if (result.success && result.data) {
        // Get the product ID from the response and redirect to its edit page
        const productId = (result as any).data?.id;
        if (productId) {
          router.push(`/super-admin/products/${productId}`);
        } else {
          // Fallback to products list if ID is not available
          router.push("/super-admin/products");
        }
      } else {
        // Fallback to products list if no data is available
        router.push("/super-admin/products");
      }
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  return (
    <div className="w-full grid-cols-3 lg:grid flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:order-1 order-2">
        <IndexPhotoUploader />
        {/* TODO: delete this components  */}
        {/* <SetPrice />
        <SetStatus /> */}
        <SetDetails />
      </div>

      <div className="col-span-2 flex-1 lg:order-2 order-1 h-fit">
        <Overall key={"overall"} />
      </div>

      <div className="border-t border-slate-200 flex justify-end items-center col-span-3 pt-2.5 mt-2 gap-2 order-3">
        <button className="rounded-xl bg-slate-200 text-slate-500 py-2 px-5 text-sm lg:w-fit w-1/2">
          بیخیال شدن
        </button>
        <button
          onClick={handleCreateProduct}
          className="rounded-xl bg-pink-500 text-white py-2 px-5 text-sm lg:w-fit w-1/2"
        >
          ذخیره
        </button>
      </div>
    </div>
  );
}
