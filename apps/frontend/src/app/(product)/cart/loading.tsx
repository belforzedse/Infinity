import PageContainer from "@/components/layout/PageContainer";
import CartSkeleton from "@/components/Skeletons/CartSkeleton";

export default function Loading() {
  return (
    <PageContainer variant="wide" className="space-y-6 pb-16 pt-8">
      <CartSkeleton />
    </PageContainer>
  );
}
