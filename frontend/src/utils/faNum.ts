export function faNum(n: number | string, opts?: Intl.NumberFormatOptions) {
  const num = typeof n === "string" ? Number(n) : n;
  if (typeof num === "number" && !Number.isNaN(num)) {
    try {
      return num.toLocaleString("fa-IR", opts);
    } catch {
      return String(num);
    }
  }
  return String(n);
}
