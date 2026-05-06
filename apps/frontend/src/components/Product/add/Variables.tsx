import { useState, useCallback } from "react";
import VariablesFeatures from "./Details/Features";
import ProductVariables from "./Details/Variable";

export default function Variables({ productId }: { productId: number }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleVariationsGenerated = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col gap-4 overflow-hidden rounded-xl bg-white">
        <VariablesFeatures
          productId={productId}
          onVariationsGenerated={handleVariationsGenerated}
        />
        <ProductVariables productId={productId} refreshKey={refreshKey} />
      </div>
      {/* <MetaOptions /> */}
    </div>
  );
}
