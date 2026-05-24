import PageContainer from "@/components/layout/PageContainer";

function PulseBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export default function PdpSkeleton() {
  return (
    <PageContainer variant="wide" className="space-y-8 pb-20 pt-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-2">
        <PulseBlock className="h-4 w-16" />
        <PulseBlock className="h-4 w-24" />
        <PulseBlock className="h-4 w-32" />
      </div>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
        <div className="grid gap-3 sm:grid-cols-[88px_minmax(0,1fr)]">
          <div className="hidden flex-col gap-3 sm:flex">
            {Array.from({ length: 4 }).map((_, index) => (
              <PulseBlock key={index} className="aspect-square w-full rounded-2xl" />
            ))}
          </div>
          <PulseBlock className="aspect-[4/5] w-full rounded-[28px]" />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <PulseBlock className="h-4 w-28" />
            <PulseBlock className="h-8 w-4/5" />
            <PulseBlock className="h-5 w-2/5" />
          </div>

          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <PulseBlock key={index} className="h-10 w-20 rounded-full" />
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4">
            <PulseBlock className="h-5 w-32" />
            <PulseBlock className="h-4 w-full" />
            <PulseBlock className="h-4 w-5/6" />
            <PulseBlock className="h-4 w-3/5" />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <PulseBlock className="h-12 rounded-full" />
            <PulseBlock className="h-12 rounded-full" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <PulseBlock className="h-7 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <PulseBlock key={index} className="aspect-[250/270] rounded-2xl" />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
