import React, { useCallback, useEffect, useState } from "react";
// import SizeGuide from "./Guide";
import SizeTable from "./Table";
import SizeGuideEditor from "./SizeGuideEditor";
import { getProductSizeHelper } from "@/services/super-admin/product/size-helper/get";
import {
  createProductSizeHelper,
  updateProductSizeHelper,
} from "@/services/super-admin/product/size-helper/create";
import { toast } from "react-hot-toast";
import { normalizeSizeGuideData, serializeSizeGuideMatrix } from "@/utils/sizeGuide";

interface SizeProps {
  productId: number;
}

const Sizes: React.FC<SizeProps> = ({ productId }) => {
  const [sizeData, setSizeData] = useState<any[]>([]);
  const [columns, setColumns] = useState<{ key: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [helperId, setHelperId] = useState<number | null>(null);

  const fetchSizeHelper = useCallback(async () => {
    try {
      const response = await getProductSizeHelper(productId);
      console.log("🔍 Size helper response:", response);

      if (response.data && response.data.length > 0) {
        const helperData = response.data[0].attributes.Helper || [];
        console.log("🔍 Helper data:", helperData);
        setHelperId(response.data[0].id);

        if (helperData && helperData.length > 0) {
          const { rows, headers } = normalizeSizeGuideData(helperData);
          console.log("🔍 Normalized rows:", rows);
          console.log("🔍 Normalized headers:", headers);
          setColumns(
            headers.map((header) => ({
              key: header,
              title: header,
            })),
          );
          setSizeData(rows);
        } else {
          console.log("🔍 No helper data, setting defaults");
          setDefaultData();
        }
      } else {
        console.log("🔍 No response data or empty array, setting defaults");
        setDefaultData();
      }
    } catch (error) {
      console.error("Error fetching size helper:", error);
      toast.error("خطا در بارگذاری راهنمای سایز");
      setDefaultData();
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchSizeHelper();
  }, [fetchSizeHelper]);

  const setDefaultData = () => {
    setColumns([
      { key: "دور سینه", title: "دور سینه" },
      { key: "دور کمر", title: "دور کمر" },
      { key: "دور باسن", title: "دور باسن" },
    ]);
    setSizeData([
      { size: "S", "دور سینه": "", "دور کمر": "", "دور باسن": "" },
      { size: "M", "دور سینه": "", "دور کمر": "", "دور باسن": "" },
      { size: "L", "دور سینه": "", "دور کمر": "", "دور باسن": "" },
    ]);
  };

  const handleSave = async (data: any[]) => {
    try {
      const helperMatrix = serializeSizeGuideMatrix(data, columns);
      if (!helperMatrix.length) {
        toast.error("لطفاً جدول راهنمای سایز را تکمیل کنید");
        return;
      }

      const helperData = {
        product: productId,
        Helper: helperMatrix,
      };

      if (helperId) {
        await updateProductSizeHelper(helperId, helperData);
      } else {
        await createProductSizeHelper(helperData);
      }

      // Don't reset the columns state - keep the edited titles
      setSizeData(data);
      setEditing(false);
      toast.success("راهنمای سایز با موفقیت ذخیره شد");

      // Don't call fetchSizeHelper() here as it would reset the column titles
    } catch (error) {
      console.error("Error saving size helper:", error);
      toast.error("خطا در ذخیره راهنمای سایز");
    }
  };

  const handleColumnTitleEdit = (columnKey: string, newTitle: string) => {
    // If newTitle is empty, it means the column is being removed
    if (newTitle === "") {
      setColumns(columns.filter((col) => col.key !== columnKey));
      return;
    }

    // Check if the column already exists
    const columnExists = columns.some((col) => col.key === columnKey);

    if (columnExists) {
      // Update existing column title
      setColumns(columns.map((col) => (col.key === columnKey ? { ...col, title: newTitle } : col)));
    } else {
      // Add new column
      setColumns([...columns, { key: columnKey, title: newTitle }]);
    }
  };

  if (loading) {
    return <div>در حال بارگذاری راهنمای سایز...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* <SizeGuide /> */}
      {editing ? (
        <SizeGuideEditor
          onSave={handleSave}
          initialData={sizeData}
          columns={columns}
          onColumnTitleEdit={handleColumnTitleEdit}
        />
      ) : sizeData.length > 0 ? (
        <div className="relative">
          <button
            onClick={() => setEditing(true)}
            className="text-sm absolute right-4 top-4 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
          >
            ویرایش راهنما
          </button>
          <SizeTable data={sizeData} columns={columns} title="راهنمای سایز" />
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="mb-4 text-neutral-600">راهنمای سایز موجود نیست</p>
          <button
            onClick={() => setEditing(true)}
            className="text-sm rounded-lg bg-blue-600 px-6 py-2.5 text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
          >
            ایجاد راهنمای سایز
          </button>
        </div>
      )}
    </div>
  );
};

export default Sizes;
