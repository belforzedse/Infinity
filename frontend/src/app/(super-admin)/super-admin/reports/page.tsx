import Link from "next/link";
export default function ReportsIndexPage() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">گزارش‌ها</h1>
      <ul className="list-disc space-y-2 pr-6">
        <li>
          <Link
            className="text-pink-600"
            href="/super-admin/reports/liquidity"
          >
            گزارش مجموع نقدینگی در بازه
          </Link>
        </li>
        <li>
          <Link
            className="text-pink-600"
            href="/super-admin/reports/product-sales"
          >
            گزارش فروش هر محصول
          </Link>
        </li>
        <li>
          <Link
            className="text-pink-600"
            href="/super-admin/reports/gateway-liquidity"
          >
            گزارش مجموع نقدینگی هر درگاه
          </Link>
        </li>
      </ul>
    </div>
  );
}
