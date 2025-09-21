import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import React, { useState, useEffect } from "react";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";

interface Feature {
  id: string;
  value: string;
}

interface ApiFeature {
  id: number;
  attributes: {
    Title: string;
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
}

export const FeaturesTable = ({ productId }: FeaturesTableProps) => {
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

  // Fetch all available options and existing variations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const authHeader = {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        };

        // Fetch all available variation options
        const [colorsRes, sizesRes, modelsRes] = await Promise.all([
          apiClient.get<ApiResponse<ApiFeature[]>>("/product-variation-colors", {
            headers: authHeader,
          }),
          apiClient.get<ApiResponse<ApiFeature[]>>("/product-variation-sizes", {
            headers: authHeader,
          }),
          apiClient.get<ApiResponse<ApiFeature[]>>("/product-variation-models", {
            headers: authHeader,
          }),
        ]);

        setAvailableOptions({
          colors: (colorsRes as any).data || [],
          sizes: (sizesRes as any).data || [],
          models: (modelsRes as any).data || [],
        });

        // Fetch existing product variations for this product
        if (productId) {
          const existingVariationsRes = await apiClient.get<ApiResponse<ProductVariation[]>>(
            `/product-variations?filters[product][id][$eq]=${productId}&populate=product_variation_color,product_variation_size,product_variation_model`,
            { headers: authHeader },
          );

          const existingVariations = (existingVariationsRes as any).data || [];

          // Extract unique colors, sizes, and models from existing variations
          const existingColors = new Map<string, Feature>();
          const existingSizes = new Map<string, Feature>();
          const existingModels = new Map<string, Feature>();

          existingVariations.forEach((variation: any) => {
            if (variation.attributes.product_variation_color?.data) {
              const colorData = variation.attributes.product_variation_color.data;
              existingColors.set(String(colorData.id), {
                id: String(colorData.id),
                value: colorData.attributes.Title,
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

          // Set the existing features
          setFeatures({
            colors: Array.from(existingColors.values()),
            sizes: Array.from(existingSizes.values()),
            models: Array.from(existingModels.values()),
          });

          // Update variations count
          setVariationsCount(existingVariations.length);
        }
      } catch (error) {
        console.error("Error fetching variation data:", error);
      }
    };

    fetchData();
  }, [productId]);

  // Generate combinations and calculate potential variations count
  useEffect(() => {
    const potentialVariationsCount =
      features.colors.length * features.sizes.length * features.models.length || 0;

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

    // Check if we have at least one option selected in each category
    if (
      features.colors.length === 0 ||
      features.sizes.length === 0 ||
      features.models.length === 0
    ) {
      alert("لطفا حداقل یک مورد از هر ویژگی را انتخاب کنید");
      return;
    }

    try {
      setIsGeneratingVariations(true);
      const authHeader = {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      };

      // Create all possible combinations
      const combinations = [];
      for (const color of features.colors) {
        for (const size of features.sizes) {
          for (const model of features.models) {
            // Generate a unique SKU for this variation
            const sku = generateSKU(color.id, size.id, model.id);

            combinations.push({
              product: productId,
              product_variation_color: parseInt(color.id),
              product_variation_size: parseInt(size.id),
              product_variation_model: parseInt(model.id),
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
        { headers: authHeader },
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

      // Create new variations
      for (const combination of newCombinations) {
        await apiClient.post("/product-variations", { data: combination }, { headers: authHeader });
      }

      alert(`${newCombinations.length} تنوع محصول با موفقیت ایجاد شد`);
    } catch (error) {
      console.error("Error generating variations:", error);
      alert("خطا در ایجاد تنوع‌های محصول");
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  return (
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
              <td className="text-sm border-l border-slate-100 px-4 py-3 text-right text-gray-900">
                رنگ
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {features.colors.map((color) => (
                    <div
                      key={color.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1"
                    >
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
                      className="text-sm w-full rounded-lg border border-slate-200 px-3 py-1.5"
                      placeholder="جستجوی رنگ..."
                      value={inputValues.colors}
                      onChange={(e) => handleInputChange("colors", e.target.value)}
                    />
                    {inputValues.colors && filteredOptions.colors.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredOptions.colors.map((option) => (
                          <div
                            key={option.id}
                            onClick={() => addFeature("colors", option)}
                            className="text-sm cursor-pointer px-3 py-2 hover:bg-slate-100"
                          >
                            {option.attributes.Title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
            <tr className="border-b border-slate-100">
              <td className="text-sm border-l border-slate-100 px-4 py-3 text-right text-gray-900">
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
                      className="text-sm w-full rounded-lg border border-slate-200 px-3 py-1.5"
                      placeholder="جستجوی سایز..."
                      value={inputValues.sizes}
                      onChange={(e) => handleInputChange("sizes", e.target.value)}
                    />
                    {inputValues.sizes && filteredOptions.sizes.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredOptions.sizes.map((option) => (
                          <div
                            key={option.id}
                            onClick={() => addFeature("sizes", option)}
                            className="text-sm cursor-pointer px-3 py-2 hover:bg-slate-100"
                          >
                            {option.attributes.Title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-sm border-l border-slate-100 px-4 py-3 text-right text-gray-900">
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
                      className="text-sm w-full rounded-lg border border-slate-200 px-3 py-1.5"
                      placeholder="جستجوی مدل..."
                      value={inputValues.models}
                      onChange={(e) => handleInputChange("models", e.target.value)}
                    />
                    {inputValues.models && filteredOptions.models.length > 0 && (
                      <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {filteredOptions.models.map((option) => (
                          <div
                            key={option.id}
                            onClick={() => addFeature("models", option)}
                            className="text-sm cursor-pointer px-3 py-2 hover:bg-slate-100"
                          >
                            {option.attributes.Title}
                          </div>
                        ))}
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
            <p className="text-xs mt-1">
              با ترکیب ویژگی‌های انتخاب شده {variationsCount} تنوع محصول ایجاد خواهد شد
            </p>
          )}
        </div>
        <button
          onClick={generateVariations}
          disabled={isGeneratingVariations || variationsCount === 0}
          className={`text-sm rounded-lg px-4 py-2 text-white ${
            isGeneratingVariations || variationsCount === 0
              ? "bg-blue-300"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isGeneratingVariations ? "در حال ایجاد تنوع‌ها..." : "ایجاد تنوع‌های محصول"}
        </button>
      </div>
    </div>
  );
};

export default FeaturesTable;
