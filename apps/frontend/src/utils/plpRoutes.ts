type QuerySource =
  | URLSearchParams
  | {
      forEach: (callback: (value: string, key: string) => void) => void;
    };

function normalizeCategorySlug(slug: string | null | undefined) {
  const normalized = slug?.trim().replace(/\/+$/, "") || "";
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

function cloneSearchParams(source?: QuerySource | null) {
  const params = new URLSearchParams();
  source?.forEach((value, key) => {
    params.append(key, value);
  });
  return params;
}

function appendQuery(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function getCategoryPlpHref(slug: string | null | undefined) {
  const normalized = normalizeCategorySlug(slug);
  return normalized ? `/plp/category/${encodeURIComponent(normalized)}` : "/plp";
}

export function getPlpHref(source?: QuerySource | null, options: { resetPage?: boolean } = {}) {
  const params = cloneSearchParams(source);
  params.delete("category");
  if (options.resetPage !== false) {
    params.delete("page");
  }
  return appendQuery("/plp", params);
}

export function getCategoryPlpHrefWithQuery(
  slug: string | null | undefined,
  source?: QuerySource | null,
  options: { resetPage?: boolean } = {},
) {
  const params = cloneSearchParams(source);
  params.delete("category");
  if (options.resetPage !== false) {
    params.delete("page");
  }
  return appendQuery(getCategoryPlpHref(slug), params);
}
