import { Header } from "@/components/Header";
import { OfflineSnapshotView } from "@/components/pwa/OfflineSnapshotView";

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-5 pb-8 pt-6 sm:px-6 lg:px-[60px]">
        <OfflineSnapshotView />
      </main>
    </div>
  );
}
