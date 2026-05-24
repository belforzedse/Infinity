import PageContainer from "@/components/layout/PageContainer";
import { SkeletonBlock } from "@repo/ui/skeleton";

function PulseBlock({ className }: { className: string }) {
  return <SkeletonBlock className={className} />;
}

export default function CheckoutSkeleton() {
  return (
    <PageContainer variant="wide" className="space-y-6 pb-16 pt-8" dir="rtl">
      <div className="space-y-2">
        <PulseBlock className="h-8 w-44" />
        <PulseBlock className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, sectionIndex) => (
            <section key={sectionIndex} className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <PulseBlock className="h-6 w-36" />
              <div className="grid gap-3 sm:grid-cols-2">
                <PulseBlock className="h-12 rounded-xl" />
                <PulseBlock className="h-12 rounded-xl" />
              </div>
              <PulseBlock className="h-20 rounded-xl" />
            </section>
          ))}
        </div>

        <aside className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <PulseBlock className="h-6 w-32" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <PulseBlock className="h-4 w-24" />
              <PulseBlock className="h-4 w-20" />
            </div>
          ))}
          <PulseBlock className="h-12 rounded-full" />
        </aside>
      </div>
    </PageContainer>
  );
}
