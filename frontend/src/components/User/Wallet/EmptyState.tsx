import Image from "next/image";

export const EmptyState = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border-slate-100 lg:border">
    <Image
      src="/images/EmptyListIcon.svg"
      alt="empty-state"
      width={180}
      height={122}
    />
    <span className="text-base text-slate-400">
      هنوز تراکنشی برای نمایش وجود ندارد!
    </span>
  </div>
);
