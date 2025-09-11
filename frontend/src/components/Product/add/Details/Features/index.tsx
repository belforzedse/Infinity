import FeaturesTable from "./Table";

export default function VariablesFeatures({
  productId,
}: {
  productId: number;
}) {
  return (
    <div className="text-base flex w-full flex-col gap-4 rounded-xl p-5 pb-0 text-neutral-600">
      <FeaturesTable productId={productId} />
    </div>
  );
}
