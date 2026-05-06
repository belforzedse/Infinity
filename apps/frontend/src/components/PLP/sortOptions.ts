export const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "جدیدترین" },
  { value: "createdAt:asc", label: "قدیمی‌ترین" },
  { value: "price:asc", label: "قیمت: کم به زیاد" },
  { value: "price:desc", label: "قیمت: زیاد به کم" },
  { value: "Title:asc", label: "عنوان: الف تا ی" },
  { value: "Title:desc", label: "عنوان: ی تا الف" },
  { value: "AverageRating:desc", label: "بالاترین امتیاز" },
  { value: "AverageRating:asc", label: "کمترین امتیاز" },
] as const;

export const SORT_LABELS: Record<string, string> = SORT_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<string, string>);

export type SortOptionValue = (typeof SORT_OPTIONS)[number]["value"];
