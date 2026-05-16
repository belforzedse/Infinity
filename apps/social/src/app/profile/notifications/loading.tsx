export default function ProfileNotificationsLoading() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="skeleton-shimmer h-7 w-20 rounded-lg" aria-hidden />
      <div className="flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-2xl bg-white shadow-[0_0_14.7px_rgba(0,0,0,0.04)]">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3" dir="rtl">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton-shimmer h-3 w-24 rounded" />
              <div className="skeleton-shimmer h-4 w-48 rounded" />
            </div>
            <div className="skeleton-shimmer h-[42px] w-[42px] shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
