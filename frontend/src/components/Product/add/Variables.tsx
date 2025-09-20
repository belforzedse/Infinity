import VariablesFeatures from "./Details/Features";
import ProductVariables from "./Details/Variable";

export default function Variables({ productId }: { productId: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col gap-4 overflow-hidden rounded-xl bg-white">
        <VariablesFeatures productId={productId} />
        <ProductVariables productId={productId} />
      </div>
      {/* <MetaOptions /> */}
    </div>
  );
}
