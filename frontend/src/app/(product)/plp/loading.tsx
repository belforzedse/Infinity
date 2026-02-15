import PageContainer from "@/components/layout/PageContainer";
import ProductListSkeleton from "@/components/Skeletons/ProductListSkeleton";

export default function PLPLoading() {
  return (
    <PageContainer variant="wide" className="space-y-6 pb-20 pt-6">
      {/* Hero area placeholder */}
      <div className="h-24 w-full animate-pulse rounded-lg bg-gray-100 md:h-32" />
      <ProductListSkeleton />
    </PageContainer>
  );
}
