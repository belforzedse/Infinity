import FeaturesTable from "./Table";

export default function VariablesFeatures({
  productId,
}: {
  productId: number;
}) {
  return (
    <div className="w-full flex flex-col gap-4 p-5 pb-0 rounded-xl text-base text-neutral-600">
      <FeaturesTable productId={productId} />
    </div>
  );
}
