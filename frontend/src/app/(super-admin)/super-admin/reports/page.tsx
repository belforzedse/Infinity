export default function ReportsIndexPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">گزارش‌ها</h1>
      <ul className="list-disc pr-6 space-y-2">
        <li>
          <a className="text-pink-600 hover:underline" href="/super-admin/reports/liquidity">گزارش مجموع نقدینگی در بازه</a>
        </li>
        <li>
          <a className="text-pink-600 hover:underline" href="/super-admin/reports/product-sales">گزارش فروش هر محصول</a>
        </li>
        <li>
          <a className="text-pink-600 hover:underline" href="/super-admin/reports/gateway-liquidity">گزارش مجموع نقدینگی هر درگاه</a>
        </li>
      </ul>
    </div>
  );
}


