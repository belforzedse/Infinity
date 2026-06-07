import { Header } from "@/components/Header";
import { SocialContainer } from "@/components/SocialContainer";
import { SearchEmptySkeleton } from "@/components/ui/skeletons/SearchEmptySkeleton";

export default function SearchLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <SocialContainer as="main" className="flex flex-1 flex-col gap-6 pb-6 pt-6 lg:pb-12">
        <SearchEmptySkeleton />
      </SocialContainer>
    </div>
  );
}
