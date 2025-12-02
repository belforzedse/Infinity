import FeaturesTable from "./Table";

interface VariablesFeaturesProps {
  productId: number;
  onVariationsGenerated?: () => void;
}

export default function VariablesFeatures({
  productId,
  onVariationsGenerated,
}: VariablesFeaturesProps) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl p-5 pb-0 text-base text-neutral-600">
      <FeaturesTable productId={productId} onVariationsGenerated={onVariationsGenerated} />
    </div>
  );
}
