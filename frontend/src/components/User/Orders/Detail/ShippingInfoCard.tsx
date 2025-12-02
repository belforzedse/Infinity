import Link from "next/link";
import type { Order } from "@/services/order";
import { faNum } from "@/utils/faNum";

interface ShippingInfoCardProps {
  order: Order;
}

const formatAddress = (order: Order) => {
  const address = order.delivery_address;
  if (!address) {
    return "آدرس ثبت نشده است.";
  }
  const parts = [
    address.shipping_city?.shipping_province?.Title,
    address.shipping_city?.Title,
    address.FullAddress,
  ].filter(Boolean);

  return parts.join("، ");
};

export default function ShippingInfoCard({ order }: ShippingInfoCardProps) {
  const shippingTitle = order.shipping?.Title || "روش ارسال انتخاب نشده";
  const addressText = formatAddress(order);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground-primary">اطلاعات ارسال</h2>
        <p className="text-sm text-slate-500">آدرس و وضعیت مرسوله خود را در این بخش مشاهده می‌کنید.</p>
      </div>

      <div className="flex flex-col gap-3 text-sm">
        <div className="flex flex-col gap-1 rounded-xl border border-slate-200 p-3">
          <span className="text-xs text-slate-500">روش ارسال</span>
          <span className="text-sm font-medium text-foreground-primary">{shippingTitle}</span>
          {order.ShippingCost ? (
            <span className="text-xs text-slate-500">هزینه ارسال: {faNum(order.ShippingCost)} تومان</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-slate-200 p-3">
          <span className="text-xs text-slate-500">آدرس تحویل</span>
          <span className="text-sm font-medium text-foreground-primary">{addressText}</span>
          {order.delivery_address?.PostalCode ? (
            <span className="text-xs text-slate-500">کدپستی: {faNum(order.delivery_address.PostalCode)}</span>
          ) : null}
        </div>

        {order.ShippingBarcode ? (
          <Link
            href={`https://anipo.ir/checkconsignment/?code=${order.ShippingBarcode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-center text-sm font-semibold text-pink-600 transition hover:bg-pink-100"
          >
            رهگیری مرسوله
          </Link>
        ) : (
          <span className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
            بارکد مرسوله هنوز ثبت نشده است.
          </span>
        )}
      </div>
    </section>
  );
}

