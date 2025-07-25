export const priceFormatter = (
  num: number,
  suffix?: string,
  prefix?: string
) => {
  return (
    (prefix ?? "") + new Intl.NumberFormat("fa-IR").format(num) + (suffix ?? "")
  );
};
