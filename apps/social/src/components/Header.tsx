import { StorefrontLogo } from "@repo/brand";

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function IconBookmark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function Divider() {
  return <span className="h-6 w-px shrink-0 bg-zinc-200" aria-hidden />;
}

/**
 * App shell header. Layout is LTR (search screen-left, logo center, actions screen-right);
 * Persian controls use dir="rtl" locally.
 */
export function Header() {
  return (
    <header
      className="sticky top-0 z-20 border-b border-zinc-200/80 bg-background/90 text-zinc-700 backdrop-blur-md"
      dir="ltr"
    >
      <div className="relative mx-auto flex min-h-[4.25rem] max-w-[1280px] items-center gap-4 px-4 py-2 sm:px-6 lg:px-[60px]">
        <div className="flex min-w-0 flex-1 justify-start">
          <button
            type="button"
            className="flex w-full max-w-[min(100%,280px)] items-center gap-2 rounded-full border border-zinc-200/80 bg-white px-4 py-2.5 text-right shadow-sm transition-opacity hover:opacity-95 sm:max-w-[320px] lg:w-[28%] lg:max-w-none"
            dir="rtl"
            aria-label="جستجو"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-400">
              دنبال چی میگردی؟
            </span>
            <IconSearch className="shrink-0 text-zinc-400" />
          </button>
        </div>

        <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 justify-center">
          <div className="pointer-events-auto [&_a]:flex [&_a]:justify-center" dir="rtl">
            <StorefrontLogo href="/" />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
          <button
            type="button"
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="نشان‌ها"
          >
            <IconBookmark />
          </button>
          <Divider />
          <button
            type="button"
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="اعلان‌ها"
          >
            <IconBell />
          </button>
          <Divider />
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white px-3 py-2 text-zinc-600 shadow-sm transition-opacity hover:opacity-95"
            dir="rtl"
            aria-label="پروفایل کاربر"
          >
            <span className="max-w-[7.5rem] truncate text-sm">کیمیای عزیز</span>
            <IconUser className="shrink-0 text-zinc-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
