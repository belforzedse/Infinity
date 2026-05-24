import PageContainer from "@/components/layout/PageContainer";
import ProductListSkeleton from "@/components/Skeletons/ProductListSkeleton";
import { SkeletonBlock } from "@repo/ui/skeleton";

export default function PLPLoading() {
  return (
    <PageContainer variant="wide" className="space-y-6 pb-20 pt-6">
      {/* Hero area placeholder */}
      <SkeletonBlock tone="light" className="h-24 w-full rounded-lg md:h-32" />
      <ProductListSkeleton />
    </PageContainer>
  );
}
