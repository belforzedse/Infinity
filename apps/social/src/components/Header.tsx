import { StorefrontLogo } from "@repo/brand";
import { Bell, Bookmark, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/SearchBar";

function Divider() {
  return <span className="h-6 w-px shrink-0 bg-zinc-200" aria-hidden />;
}

/**
 * App shell header. Desktop: LTR grid search | logo | actions.
 * Mobile (&lt; lg): light canvas, same `StorefrontLogo` as desktop (smaller), centered; notifications only.
 *
 * Icons: `lucide-react` (same stack as `@repo/frontend`).
 */
export function Header() {
  return (
    <header
      className="sticky top-0 z-20 bg-[#F8F9FB] text-zinc-700 lg:bg-background/90 lg:backdrop-blur-md"
      dir="ltr"
    >
      {/* Mobile */}
      <div className="relative flex min-h-[4.25rem] items-center px-5 py-2 sm:px-6 lg:hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto" dir="rtl">
            <StorefrontLogo href="/" width={72} height={45} />
          </div>
        </div>
        <div className="relative z-10 ml-auto">
          <button
            type="button"
            className="rounded-2xl bg-white p-2.5 text-infinity-primary shadow-sm transition-opacity hover:opacity-90"
            aria-label="اعلان‌ها"
          >
            <Bell size={20} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden min-h-[4.25rem] w-full max-w-[1280px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-5 py-2 sm:gap-4 sm:px-6 lg:grid lg:px-[60px]">
        <div className="flex min-w-0 justify-start">
          <SearchBar aria-label="جستجو" />
        </div>

        <div className="flex shrink-0 justify-center px-1" dir="rtl">
          <StorefrontLogo href="/" width={92} height={58} />
        </div>

        <div className="flex min-w-0 items-center justify-end justify-self-end gap-3 sm:gap-4">
          <button
            type="button"
            className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="نشان‌ها"
          >
            <Bookmark size={20} strokeWidth={1.5} aria-hidden />
          </button>
          <Divider />
          <button
            type="button"
            className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="اعلان‌ها"
          >
            <Bell size={20} strokeWidth={1.5} aria-hidden />
          </button>
          <Divider />
          <Button
            dir="rtl"
            aria-label="پروفایل کاربر"
            icon={
              <User
                size={20}
                strokeWidth={1.2}
                className="text-[#A49BA0]"
                aria-hidden
              />
            }
          >
            <span className="max-w-[53px] truncate">کیمیای عزیز</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
