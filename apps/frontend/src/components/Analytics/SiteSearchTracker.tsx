"use client";

import { useEffect, useRef } from "react";
import { trackSiteSearch } from "@/lib/analytics/matomo";

type Props = {
  /** The raw search keyword the visitor submitted. */
  query: string;
  /** Total number of results for the search (powers the zero-result report). */
  resultCount: number;
  /** Current results page, so paginating the same query isn't re-counted as a new search. */
  page?: number;
  /** Search surface, used as the Matomo Site Search category. */
  category?: string;
};

/**
 * Records a native Matomo Site Search from the results page, where the real
 * total result count is known. This is the single, authoritative place site
 * searches are tracked — submit handlers only navigate here, so we avoid both
 * duplicate hits and count-less searches that can't populate the zero-result
 * report. PII-bearing keywords are dropped inside `trackSiteSearch`.
 */
export default function SiteSearchTracker({ query, resultCount, page = 1, category = "plp" }: Props) {
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const key = `${trimmed}|${page}`;
    // Guard against React re-renders / Strict Mode double-invoke for the same
    // search+page. A genuinely new search or page produces a new key.
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;
    trackSiteSearch(trimmed, category, resultCount);
  }, [query, resultCount, page, category]);

  return null;
}
