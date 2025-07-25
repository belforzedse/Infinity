import VariablesFeatures from "./Details/Features";
import ProductVariables from "./Details/Variable";

export default function Variables({ productId }: { productId: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full flex flex-col gap-4 bg-white rounded-xl overflow-hidden">
        <VariablesFeatures productId={productId} />
        <ProductVariables productId={productId} />
      </div>
      {/* <MetaOptions /> */}
    </div>
  );
}
