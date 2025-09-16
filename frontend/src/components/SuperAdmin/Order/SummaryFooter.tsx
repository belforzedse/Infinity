import { priceFormatter } from "@/utils/price";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import MobileOrderItem from "./MobileOrderItem";

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
  subtotal: number;
  contractStatus:
    | "Not Ready"
    | "Confirmed"
    | "Finished"
    | "Failed"
    | "Cancelled";
  total: number;
};

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  color: string;
  image: string;
};

export default function SuperAdminOrderSummaryFooter({
  order,
}: {
  order: Order | undefined;
}) {
  if (!order) return null;

  return (
    <div className="mt-0 rounded-xl bg-white p-5 md:mt-6">
      {/* Desktop View */}
      <div className="hidden flex-col gap-2 rounded-xl border border-slate-100 p-4 md:block">
        {order.items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between border-b px-5 py-2 ${
              index === order.items.length - 1 ? "border-b-0" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <Image
                src={item.image}
                alt={item.productName}
                width={48}
                height={48}
                className="rounded-xl object-cover"
                loader={imageLoader}
              />

              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm text-foreground-primary">
                  {item.productName}
                </h3>

                <p className="text-xs text-neutral-500">
                  شناسه متغیر: {item.productCode}
                </p>
                <p className="text-xs text-neutral-500">رنگ: {item.color}</p>
              </div>
            </div>

            <div className="flex items-center gap-9">
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-500">قیمت</span>
                <p className="text-sm text-foreground-primary">
                  {priceFormatter(item.price, " تومان")}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-500">تعداد</span>
                <p className="text-sm text-foreground-primary">
                  {item.quantity}
                </p>
              </div>

              <div className="flex items-center gap-1">
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

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">موارد جمع جزء</p>
          <div className="h-[1px] flex-1 border-t border-dashed border-slate-300"></div>
          <p className="text-base text-foreground-primary">
            {priceFormatter(order.subtotal, " تومان")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">هزینه حمل و نقل (تیپاکس)</p>
          <div className="h-[1px] flex-1 border-t border-dashed border-slate-300"></div>
          <p className="text-base text-foreground-primary">
            {priceFormatter(order.shipping, " تومان")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">جمع کل سفارش</p>
          <div className="h-[1px] flex-1 border-t border-dashed border-slate-300"></div>
          <p className="text-base text-foreground-primary">
            {priceFormatter(order.total, " تومان")}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex flex-col">
          {order.contractStatus === "Not Ready" && (
            <button className="text-sm rounded-lg bg-yellow-500 px-4 py-2 text-white md:text-base">
              آماده نشده
            </button>
          )}
          {order.contractStatus === "Confirmed" && (
            <button className="text-sm rounded-lg bg-blue-500 px-4 py-2 text-white md:text-base">
              تایید شده
            </button>
          )}
          {order.contractStatus === "Finished" && (
            <button className="text-sm rounded-lg bg-green-500 px-4 py-2 text-white md:text-base">
              تکمیل شده
            </button>
          )}
          {order.contractStatus === "Failed" && (
            <button className="text-sm rounded-lg bg-red-500 px-4 py-2 text-white md:text-base">
              ناموفق
            </button>
          )}
          {order.contractStatus === "Cancelled" && (
            <button className="text-sm rounded-lg bg-gray-500 px-4 py-2 text-white md:text-base">
              لغو شده
            </button>
          )}
          {/* <p className="mr-4 text-xs md:text-sm text-gray-500">
            از طریق پرداخت اقساطی اسنپ پی
          </p> */}
        </div>

        <p className="text-sm text-foreground-primary md:text-xl">
          {priceFormatter(order.total, " تومان")}
        </p>
      </div>
    </div>
  );
}
