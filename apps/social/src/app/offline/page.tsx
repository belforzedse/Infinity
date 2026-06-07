import { Header } from "@/components/Header";
import { SocialContainer } from "@/components/SocialContainer";
import { OfflineSnapshotView } from "@/components/pwa/OfflineSnapshotView";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <SocialContainer as="main" className="flex flex-1 flex-col pb-8 pt-6">
        <OfflineSnapshotView />
      </SocialContainer>
    </div>
  );
}
