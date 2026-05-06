import { priceFormatter } from "@/utils/price";

export default function SuperAdminTableCellSimplePrice({
  price,
  inverse = false,
}: {
  price: number;
  inverse?: boolean;
}) {
  return (
    <span className="text-xs text-foreground-primary md:text-base">
      {inverse ? priceFormatter(price, " تومان", "") : priceFormatter(price, "", "تومان ")}
    </span>
  );
}
