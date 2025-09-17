"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/constants/api";
import { appendTitleFilter } from "@/constants/productFilters";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearch({ isOpen, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ id: number; Title: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't search if query is empty
    if (!searchQuery.trim()) return;

    // Close the search modal
    onClose();

    // Redirect to search results page with the query
    router.push(`/plp?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Debounced suggestions (native fetch to avoid global overlays)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        // Use regular products endpoint for live preview to support title filtering
        let url = `${API_BASE_URL}/products?filters[Title][$containsi]=${encodeURIComponent(q)}&pagination[page]=1&pagination[pageSize]=8&fields[0]=id&fields[1]=Title&_skip_global_loader=1`;
        // Add کیف کفش صندل filter to live preview suggestions
        url = appendTitleFilter(url);
        const res = await fetch(url, {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!mounted) return;
        const json = await res.json();
        setSuggestions((json?.data || []).map((i: any) => ({ id: i.id, Title: i.attributes?.Title || i.Title })));
      } catch (e) {
        if (!mounted) return;
        setSuggestions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
      controller.abort();
    };
  }, [searchQuery]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1200]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-white p-6 text-right align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg mb-4 font-medium leading-6 text-gray-900"
                >
                  جستجو
                </Dialog.Title>

                <div className="mt-2">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-sm w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500"
                      placeholder="جستجو در محصولات..."
                      dir="rtl"
                    />
                    <button
                      type="submit"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.7647 11.7647L14.6667 14.6667"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8.33333 12.0833C10.3584 12.0833 11.9999 10.4417 11.9999 8.41667C11.9999 6.39162 10.3584 4.75 8.33333 4.75C6.30828 4.75 4.66666 6.39162 4.66666 8.41667C4.66666 10.4417 6.30828 12.0833 8.33333 12.0833Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </form>
                </div>

                {/* Suggestions */}
                <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white" dir="rtl">
                  {loading && (
                    <div className="px-3 py-2 text-xs text-gray-500">در حال جستجو…</div>
                  )}
                  {!loading && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
                    <div className="px-3 py-2 text-xs text-gray-500">موردی یافت نشد</div>
                  )}
                  {!loading &&
                    suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          router.push(`/pdp/${s.id}`);
                        }}
                        className="block w-full cursor-pointer truncate bg-transparent px-3 py-2 text-right text-sm hover:bg-gray-50"
                      >
                        {s.Title}
                      </button>
                    ))}
                  {!loading && suggestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push(`/plp?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="block w-full border-t border-gray-200 bg-transparent px-3 py-2 text-right text-xs text-pink-700 hover:bg-gray-50"
                    >
                      مشاهده همه نتایج
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="text-sm inline-flex justify-center rounded-md border border-transparent bg-pink-100 px-4 py-2 font-medium text-pink-900 hover:bg-pink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    بستن
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
