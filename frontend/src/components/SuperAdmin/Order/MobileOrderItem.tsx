import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import { priceFormatter } from "@/utils/price";
import type { SuperAdminOrderItem } from "@/types/super-admin/order";

export default function SuperAdminOrderMobileOrderItem({
  item,
}: {
  item: SuperAdminOrderItem;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-slate-100">
      <div className="flex border-b">
        <div className="text-sm flex w-1/3 items-center text-nowrap bg-slate-50 px-4 py-2 text-right font-medium text-foreground-primary">
          محصول
        </div>
        <div className="flex w-2/3 items-center gap-2 border-r p-4">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.productName}
              width={48}
              height={48}
              className="rounded-xl object-cover"
              loader={imageLoader}
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-slate-200" aria-hidden />
          )}
          <span className="text-xs">{item.productName}</span>
        </div>
      </div>

      <div className="flex border-b">
        <div className="text-sm flex w-1/3 items-center text-nowrap bg-slate-50 px-4 py-2 text-right font-medium text-foreground-primary">
          شناسه متغیر
        </div>
        <div className="text-xs w-2/3 border-r p-4">{item.productCode || "-"}</div>
      </div>

      <div className="flex border-b">
        <div className="text-sm flex w-1/3 items-center text-nowrap bg-slate-50 px-4 py-2 text-right font-medium text-foreground-primary">
          رنگ
        </div>
        <div className="text-xs w-2/3 border-r p-4">{item.color ?? '-'}</div>
      </div>

      <div className="flex border-b">
        <div className="text-sm flex w-1/3 items-center text-nowrap bg-slate-50 px-4 py-2 text-right font-medium text-foreground-primary">
          سایز
        </div>
        <div className="text-xs w-2/3 border-r p-4">{item.size ?? '-'}</div>
      </div>

      <div className="flex border-b">
        <div className="text-sm flex w-1/3 items-center text-nowrap bg-slate-50 px-4 py-2 text-right font-medium text-foreground-primary">
          مدل
        </div>
        <div className="text-xs w-2/3 border-r p-4">{item.model ?? '-'}</div>
      </div>

      <div className="flex border-b">
        <div className="text-sm flex w-1/3 items-center text-nowrap bg-slate-50 px-4 py-2 text-right font-medium text-foreground-primary">
          قیمت
        </div>
        <div className="text-xs w-2/3 border-r p-4">{priceFormatter(item.price, " تومان")}</div>
      </div>

      <div className="flex border-b">
        <div className="text-sm flex w-1/3 items-center text-nowrap bg-slate-50 px-4 py-2 text-right font-medium text-foreground-primary">
          تعداد
        </div>
        <div className="text-xs w-2/3 border-r p-4">{item.quantity}</div>
      </div>

      <div className="flex">
        <div className="text-sm flex w-1/3 items-center text-nowrap bg-slate-50 px-4 py-2 text-right font-medium text-foreground-primary">
          مجموع
        </div>
        <div className="text-xs w-2/3 border-r p-4">
          {priceFormatter(item.price * item.quantity, " تومان")}
        </div>
      </div>
    </div>
  );
}
