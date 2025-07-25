import { priceFormatter } from "@/utils/price";
import Image from "next/image";
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
              <Image
                src={item.image}
                alt={item.productName}
                width={48}
                height={48}
                className="rounded-xl object-cover"
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
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">هزینه حمل و نقل (تیپاکس)</p>
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
      </div>

      <div className="mt-8 p-4 flex justify-between items-center border-slate-100 border rounded-xl bg-slate-50">
        <div className="flex flex-col">
          {order.contractStatus === "Not Ready" && (
            <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm md:text-base">
              آماده نشده
            </button>
          )}
          {order.contractStatus === "Confirmed" && (
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm md:text-base">
              تایید شده
            </button>
          )}
          {order.contractStatus === "Finished" && (
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm md:text-base">
              تکمیل شده
            </button>
          )}
          {order.contractStatus === "Failed" && (
            <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm md:text-base">
              ناموفق
            </button>
          )}
          {order.contractStatus === "Cancelled" && (
            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm md:text-base">
              لغو شده
            </button>
          )}
          {/* <p className="mr-4 text-xs md:text-sm text-gray-500">
            از طریق پرداخت اقساطی اسنپ پی
          </p> */}
        </div>

        <p className="text-sm md:text-xl text-foreground-primary">
          {priceFormatter(order.total, " تومان")}
        </p>
      </div>
    </div>
  );
}
