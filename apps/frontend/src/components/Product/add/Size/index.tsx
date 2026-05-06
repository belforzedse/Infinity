import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
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
import { atom, useAtom } from "jotai";

interface SizeProps {
  productId: number;
}

export interface SizeGuideHandle {
  save: () => Promise<boolean>;
}

const sizeGuideDraftAtom = atom<
  Record<number, { data: any[]; columns: { key: string; title: string }[]; helperId?: number | null }>
>({});

const Sizes = forwardRef<SizeGuideHandle, SizeProps>(({ productId }, ref) => {
  const [drafts, setDrafts] = useAtom(sizeGuideDraftAtom);
  const initialDraft = drafts[productId];

  const [sizeData, setSizeData] = useState<any[]>(initialDraft?.data || []);
  const [columns, setColumns] = useState<{ key: string; title: string }[]>(
    initialDraft?.columns || [],
  );
  const [loading, setLoading] = useState(!initialDraft);
  const [editing, setEditing] = useState(false);
  const [helperId, setHelperId] = useState<number | null>(initialDraft?.helperId ?? null);

  const startEditing = () => {
    // If there is no data loaded yet, seed a minimal editable grid
    if (sizeData.length === 0 && columns.length === 0) {
      const blankColumns = [
        { key: "metric-1", title: "" },
        { key: "metric-2", title: "" },
      ];
      setColumns(blankColumns);
      setSizeData([{ size: "" }]);
    }
    setEditing(true);
  };

  const fetchSizeHelper = useCallback(async () => {
    if (loading === false && sizeData.length > 0) return;

    try {
      const response = await getProductSizeHelper(productId);
      const helper = response.data?.[0];

      if (helper) {
        setHelperId(helper.id);
        const helperData = helper.attributes.Helper || [];
        const { rows, headers } = normalizeSizeGuideData(helperData);
        if (rows.length > 0 || headers.length > 0) {
          setColumns(headers.map((header) => ({ key: header, title: header })));
          setSizeData(rows);
        } else {
          setDefaultData();
        }
      } else {
        setDefaultData();
      }
    } catch (error) {
      console.error("Error fetching size helper:", error);
      toast.error("خطا در بارگذاری راهنمای سایز");
      setDefaultData();
    } finally {
      setLoading(false);
    }
  }, [loading, productId, sizeData.length]);

  useEffect(() => {
    fetchSizeHelper();
  }, [fetchSizeHelper]);

  // Persist drafts so tab changes don't lose unsaved edits
  useEffect(() => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: { data: sizeData, columns, helperId },
    }));
  }, [productId, sizeData, columns, helperId, setDrafts]);

  const setDefaultData = () => {
    // No default rows/columns on view; show empty state until user edits/creates
    setColumns([]);
    setSizeData([]);
  };

  const handleSave = useCallback(async (data: any[]) => {
    try {
      const helperMatrix = serializeSizeGuideMatrix(data, columns);
      if (!helperMatrix.length) {
        toast.error("لطفاً جدول راهنمای سایز را تکمیل کنید");
        return false;
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
      return true;
    } catch (error) {
      console.error("Error saving size helper:", error);
      toast.error("خطا در ذخیره راهنمای سایز");
      return false;
    }
  }, [columns, helperId, productId]);

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

  useImperativeHandle(
    ref,
    () => ({
      save: async () => {
        const payload = editing ? sizeData : sizeData;
        return handleSave(payload);
      },
    }),
    [editing, sizeData, handleSave],
  );

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
          onDataChange={(nextData, nextColumns) => {
            setSizeData(nextData);
            setColumns(nextColumns);
          }}
        />
      ) : sizeData.length > 0 ? (
        <div className="relative">
          <button
            onClick={startEditing}
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
});

Sizes.displayName = "Sizes";

export default Sizes;
