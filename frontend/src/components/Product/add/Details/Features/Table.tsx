import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import React, { Fragment, useState, useEffect, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { apiClient } from "@/services";
import toast from "react-hot-toast";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";

interface Feature {
  id: string;
  value: string;
  colorCode?: string;
}

interface ApiFeature {
  id: number;
  attributes: {
    Title: string;
    ColorCode?: string;
    [key: string]: any;
  };
}

interface ApiResponse<T> {
  data: T;
  meta?: any;
}

interface ProductVariation {
  id: number;
  attributes: {
    product: {
      data: {
        id: number;
      };
    };
    product_variation_color?: {
      data: {
        id: number;
        attributes: {
          Title: string;
        };
      };
    };
    product_variation_size?: {
      data: {
        id: number;
        attributes: {
          Title: string;
        };
      };
    };
    product_variation_model?: {
      data: {
        id: number;
        attributes: {
          Title: string;
        };
      };
    };
    SKU?: string;
    Price?: number;
    DiscountPrice?: number;
  };
}

interface FeatureGroup {
  colors: Feature[];
  sizes: Feature[];
  models: Feature[];
}

interface FeaturesTableProps {
  productId: number;
  onVariationsGenerated?: () => void;
}

const COLOR_PALETTE = [
  "#000000",
  "#1f2937",
  "#374151",
  "#4b5563",
  "#6b7280",
  "#94a3b8",
  "#cbd5f5",
  "#ffffff",
  "#f5f5f5",
  "#e5e7eb",
  "#991b1b",
  "#dc2626",
  "#f87171",
  "#fee2e2",
  "#f97316",
  "#fb923c",
  "#fed7aa",
  "#fef3c7",
  "#facc15",
  "#a16207",
  "#ca8a04",
  "#84cc16",
  "#22c55e",
  "#16a34a",
  "#0d9488",
  "#14b8a6",
  "#2dd4bf",
  "#06b6d4",
  "#0ea5e9",
  "#2563eb",
  "#1d4ed8",
  "#3b82f6",
  "#60a5fa",
  "#818cf8",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f472b6",
  "#f9a8d4",
  "#fda4af",
  "#fb7185",
  "#f43f5e",
  "#be185d",
  "#831843",
  "#475569",
  "#334155",
];

const ATTRIBUTE_ENDPOINTS = {
  colors: "/product-variation-colors",
  sizes: "/product-variation-sizes",
  models: "/product-variation-models",
} as const;

const DEFAULT_TITLES: Record<"sizes" | "models", string> = {
  sizes: "تک سایز",
  models: "استاندارد",
};

export const FeaturesTable = ({ productId, onVariationsGenerated }: FeaturesTableProps) => {
  const [features, setFeatures] = useState<FeatureGroup>({
    colors: [],
    sizes: [],
    models: [],
  });

  const [availableOptions, setAvailableOptions] = useState<{
    colors: ApiFeature[];
    sizes: ApiFeature[];
    models: ApiFeature[];
  }>({
    colors: [],
    sizes: [],
    models: [],
  });

  const [inputValues, setInputValues] = useState({
    colors: "",
    sizes: "",
    models: "",
  });

  const [filteredOptions, setFilteredOptions] = useState<{
    colors: ApiFeature[];
    sizes: ApiFeature[];
    models: ApiFeature[];
  }>({
    colors: [],
    sizes: [],
    models: [],
  });

  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [variationsCount, setVariationsCount] = useState(0);
  const [colorModal, setColorModal] = useState({
    isOpen: false,
    name: "",
    colorCode: "#000000",
  });
  const [creationLoading, setCreationLoading] = useState({
    colors: false,
    sizes: false,
    models: false,
  });

  const createAttributeOption = async (
    type: "colors" | "sizes" | "models",
    payload: { Title: string; ColorCode?: string },
  ) => {
    const title = payload.Title?.trim();
    if (!title) {
      toast.error("نام ویژگی نمی‌تواند خالی باشد");
      return null;
    }

    setCreationLoading((prev) => ({ ...prev, [type]: true }));
    try {
      const response = await apiClient.post<ApiFeature>(ATTRIBUTE_ENDPOINTS[type], {
        data: payload,
      });
      const created = response.data;

      setAvailableOptions((prev) => ({
        ...prev,
        [type]: [...prev[type], created],
      }));

      addFeature(type, created);
      toast.success(`${title} با موفقیت اضافه شد`);
      return created;
    } catch (error: any) {
      console.error("Error creating variation option:", error);
      const rawErrorMessage = extractErrorMessage(error);
      const message = translateErrorMessage(
        rawErrorMessage,
        "خطا در ایجاد ویژگی جدید. لطفاً دوباره تلاش کنید.",
      );
      toast.error(message);
      return null;
    } finally {
      setCreationLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const openColorModal = (prefill?: string) => {
    setColorModal({
      isOpen: true,
      name: prefill?.trim() || "",
      colorCode: "#000000",
    });
  };

  const closeColorModal = () =>
    setColorModal((prev) => ({
      ...prev,
      isOpen: false,
    }));

  const handleColorChange = (value: string) => {
    if (!value) {
      return;
    }
    const normalized = value.startsWith("#") ? value : `#${value}`;
    setColorModal((prev) => ({
      ...prev,
      colorCode: normalized.toLowerCase(),
    }));
  };

  const handleSaveColor = async () => {
    if (!colorModal.name.trim()) {
      toast.error("نام رنگ را وارد کنید");
      return;
    }
    const saved = await createAttributeOption("colors", {
      Title: colorModal.name.trim(),
      ColorCode: colorModal.colorCode,
    });
    if (saved) {
      setInputValues((prev) => ({ ...prev, colors: "" }));
      closeColorModal();
    }
  };

  const handleCreateTextOption = async (type: "sizes" | "models", label: string) => {
    const created = await createAttributeOption(type, {
      Title: label.trim(),
    });
    if (created) {
      setInputValues((prev) => ({ ...prev, [type]: "" }));
    }
  };

  const fetchVariationData = useCallback(async () => {
    try {
      const [colorsRes, sizesRes, modelsRes] = await Promise.all([
        apiClient.get<ApiResponse<ApiFeature[]>>("/product-variation-colors"),
        apiClient.get<ApiResponse<ApiFeature[]>>("/product-variation-sizes"),
        apiClient.get<ApiResponse<ApiFeature[]>>("/product-variation-models"),
      ]);

      setAvailableOptions({
        colors: (colorsRes as any).data || [],
        sizes: (sizesRes as any).data || [],
        models: (modelsRes as any).data || [],
      });

      if (!productId) {
        setFeatures({
          colors: [],
          sizes: [],
          models: [],
        });
        setVariationsCount(0);
        return;
      }

      const existingVariationsRes = await apiClient.get<ApiResponse<ProductVariation[]>>(
        `/product-variations?filters[product][id][$eq]=${productId}&populate=product_variation_color,product_variation_size,product_variation_model`,
      );

      const existingVariations = (existingVariationsRes as any).data || [];

      const existingColors = new Map<string, Feature>();
      const existingSizes = new Map<string, Feature>();
      const existingModels = new Map<string, Feature>();

      existingVariations.forEach((variation: any) => {
        if (variation.attributes.product_variation_color?.data) {
          const colorData = variation.attributes.product_variation_color.data;
          existingColors.set(String(colorData.id), {
            id: String(colorData.id),
            value: colorData.attributes.Title,
            colorCode: colorData.attributes.ColorCode,
          });
        }

        if (variation.attributes.product_variation_size?.data) {
          const sizeData = variation.attributes.product_variation_size.data;
          existingSizes.set(String(sizeData.id), {
            id: String(sizeData.id),
            value: sizeData.attributes.Title,
          });
        }

        if (variation.attributes.product_variation_model?.data) {
          const modelData = variation.attributes.product_variation_model.data;
          existingModels.set(String(modelData.id), {
            id: String(modelData.id),
            value: modelData.attributes.Title,
          });
        }
      });

      setFeatures({
        colors: Array.from(existingColors.values()),
        sizes: Array.from(existingSizes.values()),
        models: Array.from(existingModels.values()),
      });

      setVariationsCount(existingVariations.length);
    } catch (error) {
      console.error("Error fetching variation data:", error);
    }
  }, [productId]);

  // Fetch all available options and existing variations
  useEffect(() => {
    fetchVariationData();
  }, [fetchVariationData]);

  // Generate combinations and calculate potential variations count
  useEffect(() => {
    // Account for default values when sizes or models are empty
    const sizeCount = features.sizes.length > 0 ? features.sizes.length : 1;
    const modelCount = features.models.length > 0 ? features.models.length : 1;
    const potentialVariationsCount = features.colors.length * sizeCount * modelCount;

    setVariationsCount(potentialVariationsCount);
  }, [features]);

  // Filter options based on input and already selected items
  useEffect(() => {
    const filterOptions = (type: "colors" | "sizes" | "models") => {
      const query = inputValues[type].toLowerCase();
      const selectedIds = features[type].map((item) => item.id);

      return availableOptions[type].filter(
        (option) =>
          option.attributes.Title.toLowerCase().includes(query) &&
          !selectedIds.includes(String(option.id)),
      );
    };

    setFilteredOptions({
      colors: filterOptions("colors"),
      sizes: filterOptions("sizes"),
      models: filterOptions("models"),
    });
  }, [inputValues, features, availableOptions]);

  const handleInputChange = (type: "colors" | "sizes" | "models", value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const addFeature = (type: "colors" | "sizes" | "models", item: ApiFeature) => {
    // Check if this item is already selected
    const isDuplicate = features[type].some((feature) => feature.id === String(item.id));

    if (isDuplicate) return;

    const newFeature: Feature = {
      id: String(item.id),
      value: item.attributes.Title,
      colorCode: item.attributes.ColorCode,
    };

    setFeatures((prev) => ({
      ...prev,
      [type]: [...prev[type], newFeature],
    }));

    // Clear input after selection
    setInputValues((prev) => ({
      ...prev,
      [type]: "",
    }));
  };

  const removeFeature = (type: "colors" | "sizes" | "models", id: string) => {
    setFeatures((prev) => ({
      ...prev,
      [type]: prev[type].filter((feature) => feature.id !== id),
    }));
  };

  // Generate a random SKU
  const generateSKU = (colorCode: string, sizeCode: string, modelCode: string) => {
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${productId}-${colorCode}-${sizeCode}-${modelCode}-${randomPart}`;
  };

  const generateVariations = async () => {
    if (!productId || isGeneratingVariations) return;

    // Check if we have at least one color selected
    if (features.colors.length === 0) {
      alert("لطفاً حداقل یک رنگ برای محصول انتخاب کنید");
      return;
    }

    try {
      setIsGeneratingVariations(true);
      // Create all possible combinations
      const combinations = [];
      const colorList = features.colors;
      const sizeOptions =
        features.sizes.length > 0
          ? features.sizes
          : [{ id: "default-size", value: DEFAULT_TITLES.sizes }];
      const modelOptions =
        features.models.length > 0
          ? features.models
          : [{ id: "default-model", value: DEFAULT_TITLES.models }];
      for (const color of colorList) {
        for (const size of sizeOptions) {
          for (const model of modelOptions) {
            // Generate a unique SKU for this variation
            const sku = generateSKU(
              color.id,
              size.id || "default-size",
              model.id || "default-model",
            );

            combinations.push({
              product: productId,
              product_variation_color: parseInt(color.id),
              ...(features.sizes.length > 0 ? { product_variation_size: parseInt(size.id) } : {}),
              ...(features.models.length > 0
                ? { product_variation_model: parseInt(model.id) }
                : {}),
              SKU: sku,
              Price: 0, // Default price is 0
              DiscountPrice: null, // Default discount price is null
            });
          }
        }
      }

      // Fetch existing variations to avoid duplicates
      const existingVariationsRes = await apiClient.get<ApiResponse<ProductVariation[]>>(
        `/product-variations?filters[product][id][$eq]=${productId}&populate=product_variation_color,product_variation_size,product_variation_model`,
      );

      const existingVariations = (existingVariationsRes as any).data || [];

      // Filter out combinations that already exist
      const newCombinations = combinations.filter((comb) => {
        return !existingVariations.some((existing: any) => {
          const existingColor = existing.attributes.product_variation_color?.data?.id;
          const existingSize = existing.attributes.product_variation_size?.data?.id;
          const existingModel = existing.attributes.product_variation_model?.data?.id;

          return (
            existingColor === comb.product_variation_color &&
            existingSize === comb.product_variation_size &&
            existingModel === comb.product_variation_model
          );
        });
      });

      for (const combination of newCombinations) {
        await apiClient.post("/product-variations", { data: combination });
      }

      await fetchVariationData();
      onVariationsGenerated?.();

      if (newCombinations.length === 0) {
        toast("هیچ تنوع جدیدی برای ایجاد وجود نداشت");
      } else {
        toast.success(`${newCombinations.length} تنوع جدید با موفقیت ایجاد شد`);
      }
    } catch (error) {
      console.error("Error generating variations:", error);
      toast.error("خطا در ایجاد تنوع‌های محصول");
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="w-full rounded-xl border border-slate-100">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="w-[20%] border-l border-slate-100 px-4 py-2 text-right font-normal text-gray-900">
                  ویژگی
                </th>
                <th className="w-[80%] px-4 py-2 text-right font-normal text-gray-900">مقدارها</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="border-l border-slate-100 px-4 py-3 text-right text-sm text-gray-900">
                  رنگ
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {features.colors.map((color) => (
                      <div
                        key={color.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-slate-200"
                          style={{ backgroundColor: color.colorCode || "#f5f5f5" }}
                          aria-label={`کد رنگ ${color.colorCode || "نامشخص"}`}
                        />
                        <span className="text-sm text-slate-500">{color.value}</span>
                        <button
                          onClick={() => removeFeature("colors", color.id)}
                          className="text-slate-400"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    ))}
                    <div className="relative min-w-[140px] flex-1">
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                        placeholder="جستجوی رنگ..."
                        value={inputValues.colors}
                        onChange={(e) => handleInputChange("colors", e.target.value)}
                      />
                      {inputValues.colors && (
                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                          {filteredOptions.colors.length > 0 ? (
                            filteredOptions.colors.map((option) => (
                              <div
                                key={option.id}
                                onClick={() => addFeature("colors", option)}
                                className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-100"
                              >
                                <span
                                  className="h-5 w-5 rounded-full border border-slate-200"
                                  style={{
                                    backgroundColor: option.attributes.ColorCode || "#f5f5f5",
                                  }}
                                />
                                <span>{option.attributes.Title}</span>
                                {option.attributes.ColorCode && (
                                  <span className="text-xs text-slate-400">
                                    {option.attributes.ColorCode.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-neutral-500">موردی یافت نشد</div>
                          )}
                          <button
                            type="button"
                            disabled={creationLoading.colors}
                            onClick={() => openColorModal(inputValues.colors)}
                            className={`flex w-full items-center justify-between border-t border-slate-100 px-3 py-2 text-xs ${
                              creationLoading.colors
                                ? "cursor-not-allowed text-slate-400"
                                : "text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            <span>افزودن رنگ «{inputValues.colors}»</span>
                            <span aria-hidden="true">+</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={creationLoading.colors}
                      onClick={() => openColorModal()}
                      className={`rounded-full border border-dashed border-slate-200 px-3 py-1 text-xs transition ${
                        creationLoading.colors
                          ? "cursor-not-allowed text-slate-400"
                          : "text-blue-600 hover:border-blue-400 hover:text-blue-700"
                      }`}
                    >
                      افزودن رنگ دلخواه
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="border-l border-slate-100 px-4 py-3 text-right text-sm text-gray-900">
                  سایز
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {features.sizes.map((size) => (
                      <div
                        key={size.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-100 px-2 py-1"
                      >
                        <span className="text-sm text-slate-500">{size.value}</span>
                        <button
                          onClick={() => removeFeature("sizes", size.id)}
                          className="text-slate-400"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    ))}
                    <div className="relative min-w-[140px] flex-1">
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                        placeholder="جستجوی سایز..."
                        value={inputValues.sizes}
                        onChange={(e) => handleInputChange("sizes", e.target.value)}
                      />
                      {inputValues.sizes && (
                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                          {filteredOptions.sizes.length > 0 ? (
                            filteredOptions.sizes.map((option) => (
                              <div
                                key={option.id}
                                onClick={() => addFeature("sizes", option)}
                                className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100"
                              >
                                {option.attributes.Title}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-neutral-500">موردی یافت نشد</div>
                          )}
                          <button
                            type="button"
                            disabled={creationLoading.sizes}
                            onClick={() => handleCreateTextOption("sizes", inputValues.sizes)}
                            className={`flex w-full items-center justify-between border-t border-slate-100 px-3 py-2 text-xs ${
                              creationLoading.sizes
                                ? "cursor-not-allowed text-slate-400"
                                : "text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            <span>افزودن سایز «{inputValues.sizes}»</span>
                            <span aria-hidden="true">+</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border-l border-slate-100 px-4 py-3 text-right text-sm text-gray-900">
                  مدل
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {features.models.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-100 px-2 py-1"
                      >
                        <span className="text-sm text-slate-500">{model.value}</span>
                        <button
                          onClick={() => removeFeature("models", model.id)}
                          className="text-slate-400"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    ))}
                    <div className="relative min-w-[140px] flex-1">
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                        placeholder="جستجوی مدل..."
                        value={inputValues.models}
                        onChange={(e) => handleInputChange("models", e.target.value)}
                      />
                      {inputValues.models && (
                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                          {filteredOptions.models.length > 0 ? (
                            filteredOptions.models.map((option) => (
                              <div
                                key={option.id}
                                onClick={() => addFeature("models", option)}
                                className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100"
                              >
                                {option.attributes.Title}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-neutral-500">موردی یافت نشد</div>
                          )}
                          <button
                            type="button"
                            disabled={creationLoading.models}
                            onClick={() => handleCreateTextOption("models", inputValues.models)}
                            className={`flex w-full items-center justify-between border-t border-slate-100 px-3 py-2 text-xs ${
                              creationLoading.models
                                ? "cursor-not-allowed text-slate-400"
                                : "text-blue-600 hover:bg-blue-50"
                            }`}
                          >
                            <span>افزودن مدل «{inputValues.models}»</span>
                            <span aria-hidden="true">+</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
          <div className="text-sm text-slate-600">
            <p>
              تعداد تنوع‌های محصول: <span className="font-semibold">{variationsCount}</span>
            </p>
            {variationsCount > 0 && (
              <p className="mt-1 text-xs">
                با ترکیب ویژگی‌های انتخاب شده {variationsCount} تنوع محصول ایجاد خواهد شد
              </p>
            )}
          </div>
          <button
            onClick={generateVariations}
            disabled={isGeneratingVariations || variationsCount === 0}
            className={`rounded-lg px-4 py-2 text-sm text-white ${
              isGeneratingVariations || variationsCount === 0
                ? "bg-blue-300"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isGeneratingVariations ? "در حال ایجاد تنوع‌ها..." : "ایجاد تنوع‌های محصول"}
          </button>
        </div>
      </div>

      <Transition appear show={colorModal.isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[1300]" onClose={closeColorModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-lg font-medium text-neutral-900">
                    افزودن رنگ جدید
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm text-neutral-600">نام رنگ</label>
                      <input
                        type="text"
                        value={colorModal.name}
                        onChange={(e) =>
                          setColorModal((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                        placeholder="مثلاً آبی آسمانی"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600">انتخاب رنگ</label>
                      <div className="mt-3 flex flex-col gap-4 md:flex-row">
                        <div className="flex-1">
                          <HexColorPicker
                            color={colorModal.colorCode}
                            onChange={handleColorChange}
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <span className="text-xs text-neutral-500">کد HEX</span>
                            <HexColorInput
                              prefixed
                              color={colorModal.colorCode}
                              onChange={handleColorChange}
                              aria-label="کد رنگ"
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                            />
                          </div>
                          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <span
                              className="h-10 w-10 rounded-lg border border-slate-200"
                              style={{ backgroundColor: colorModal.colorCode }}
                              aria-hidden="true"
                            />
                            <div className="text-xs text-neutral-500">
                              <p className="font-medium text-neutral-700">نمونه رنگ انتخابی</p>
                              <p>{colorModal.colorCode.toUpperCase()}</p>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-500">
                            می‌توانید کد رنگ را بچسبانید یا از انتخاب‌گر برای پیدا کردن دقیق‌ترین
                            طیف استفاده کنید.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs font-medium text-neutral-600">رنگ‌های پر استفاده</p>
                        <div className="mt-2 grid grid-cols-5 gap-2">
                          {COLOR_PALETTE.map((color) => (
                            <button
                              type="button"
                              key={color}
                              onClick={() => handleColorChange(color)}
                              className={`h-10 w-full rounded-lg border ${
                                colorModal.colorCode.toLowerCase() === color.toLowerCase()
                                  ? "border-blue-500 ring-2 ring-blue-200"
                                  : "border-slate-200"
                              }`}
                              style={{ backgroundColor: color }}
                              aria-label={`انتخاب رنگ ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeColorModal}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-neutral-600"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      disabled={creationLoading.colors}
                      onClick={handleSaveColor}
                      className={`rounded-lg px-4 py-2 text-sm text-white ${
                        creationLoading.colors ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      ذخیره رنگ
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default FeaturesTable;
