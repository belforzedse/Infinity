import { priceFormatter } from "@/utils/price";
import Image from "next/image";
import MobileOrderItem from "./MobileOrderItem";
import { translateContractStatus } from "@/utils/statusTranslations";

type Order = {
  id: number;
  orderDate: Date;
  orderStatus: string;
  userId: string;
  description: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  shipping: number;
  shippingMethod?: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  contractStatus:
    | "Not Ready"
    | "Confirmed"
    | "Finished"
    | "Failed"
    | "Cancelled";
  total: number;
  paymentToken?: string | null;
};

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  color?: string;
  image?: string;
};

export default function SuperAdminOrderSummaryFooter({
  order,
  onReload,
}: {
  order: Order | undefined;
  onReload?: () => void;
}) {
  if (!order) return null;

  const contractStatusClass = (() => {
    const normalized = order.contractStatus?.toLowerCase().replace(/\s+/g, " ") || "";
    switch (normalized) {
      case "not ready":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-blue-500";
      case "finished":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "cancelled":
      case "canceled":
        return "bg-gray-500";
      default:
        return "bg-slate-500";
    }
  })();

  return (
    <div className="bg-white rounded-xl p-5 mt-0 md:mt-6">
      {/* Desktop View */}
      <div className="hidden md:block border border-slate-100 rounded-xl p-4 flex-col gap-2">
        {order.items.map((item, index) => (
          <div
            key={item.id}
            className={`flex justify-between items-center px-5 py-2 border-b ${
              index === order.items.length - 1 ? "border-b-0" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.productName}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm text-foreground-primary">
                  {item.productName}
                </h3>

                <p className="text-xs text-neutral-500">
                  شناسه متغیر: {item.productCode}
                </p>
                <p className="text-xs text-neutral-500">رنگ: {item.color ?? "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-9">
              <div className="flex gap-1 items-center">
                <span className="text-xs text-neutral-500">قیمت</span>
                <p className="text-sm text-foreground-primary">
                  {priceFormatter(item.price, " تومان")}
                </p>
              </div>

              <div className="flex gap-1 items-center">
                <span className="text-xs text-neutral-500">تعداد</span>
                <p className="text-sm text-foreground-primary">
                  {item.quantity}
                </p>
              </div>

              <div className="flex gap-1 items-center">
                <span className="text-xs text-neutral-500">مجموع</span>
                <p className="text-sm text-foreground-primary">
                  {priceFormatter(item.price * item.quantity, " تومان")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {order.items.map((item) => (
          <MobileOrderItem key={item.id} item={item} />
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 p-4 bg-white rounded-xl border border-slate-100">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">موارد جمع جزء</p>
          <div className="flex-1 h-[1px] border-t border-slate-300 border-dashed"></div>
          <p className="text-base text-foreground-primary">
            {priceFormatter(order.subtotal, " تومان")}
          </p>
        </div>
        {typeof order.discount === "number" ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">تخفیف</p>
            <div className="flex-1 h-[1px] border-t border-slate-300 border-dashed"></div>
            <p className="text-base text-foreground-primary">
              {priceFormatter(order.discount, " تومان")}
            </p>
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">
            هزینه حمل و نقل {order.shippingMethod ? `(${order.shippingMethod})` : ""}
          </p>
          <div className="flex-1 h-[1px] border-t border-slate-300 border-dashed"></div>
          <p className="text-base text-foreground-primary">
            {priceFormatter(order.shipping, " تومان")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">جمع کل سفارش</p>
          <div className="flex-1 h-[1px] border-t border-slate-300 border-dashed"></div>
          <p className="text-base text-foreground-primary">
            {priceFormatter(order.total, " تومان")}
          </p>
        </div>
        {order.paymentToken ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">توکن پرداخت SnappPay</p>
            <div className="flex-1 h-[1px] border-t border-slate-300 border-dashed"></div>
            <p className="text-base font-mono text-foreground-primary ltr">
              {order.paymentToken}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-8 p-4 flex justify-between items-center border-slate-100 border rounded-xl bg-slate-50">
        <div className="flex flex-col">
          <button className={`px-4 py-2 ${contractStatusClass} text-white rounded-lg text-sm md:text-base`}>
            {translateContractStatus(order.contractStatus)}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm md:text-xl text-foreground-primary">
            {priceFormatter(order.total, " تومان")}
          </p>
        </div>
      </div>
    </div>
  );
}
