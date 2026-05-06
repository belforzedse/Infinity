const FALLBACK_HEADER_OFFSET = 88; // px - matches typical header height
const EXTRA_MARGIN = 8;

const parseHeaderOffset = () => {
  if (typeof window === "undefined") return FALLBACK_HEADER_OFFSET;
  const rootStyle = getComputedStyle(document.documentElement);
  const raw = rootStyle.getPropertyValue("--header-offset") || `${FALLBACK_HEADER_OFFSET}px`;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : FALLBACK_HEADER_OFFSET;
};

export const getHeaderOffset = (extra = 0) => Math.max(0, parseHeaderOffset() + extra);

export const scrollIntoViewWithOffset = (
  target: HTMLElement | null,
  { extra = EXTRA_MARGIN, fallbackTop = 0 }: { extra?: number; fallbackTop?: number } = {},
) => {
  if (typeof window === "undefined") return;
  const offset = getHeaderOffset(extra);

  if (!target) {
    const top = Math.max(0, fallbackTop - offset);
    window.scrollTo({ top, behavior: "smooth" });
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
};

