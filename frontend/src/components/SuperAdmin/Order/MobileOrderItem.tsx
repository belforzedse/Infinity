import Image from "next/image";
import { priceFormatter } from "@/utils/price";

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

export default function SuperAdminOrderMobileOrderItem({
  item,
}: {
  item: OrderItem;
}) {
  return (
    <div className="border border-slate-100 rounded-xl mb-4 overflow-hidden">
      <div className="flex border-b">
        <div className="w-1/3 py-2 px-4 flex text-right items-center bg-gray-50 text-sm text-nowrap text-foreground-primary font-medium">
          محصول
        </div>
        <div className="w-2/3 p-4 flex items-center gap-2 border-r">
          <Image
            src={item.image}
            alt={item.productName}
            width={48}
            height={48}
            className="rounded-xl object-cover"
          />
          <span className="text-xs">{item.productName}</span>
        </div>
      </div>

      <div className="flex border-b">
        <div className="w-1/3 py-2 px-4 flex text-right items-center bg-gray-50 text-sm text-nowrap text-foreground-primary font-medium">
          شناسه متغیر
        </div>
        <div className="w-2/3 p-4 border-r text-xs">{item.productCode}</div>
      </div>

      <div className="flex border-b">
        <div className="w-1/3 py-2 px-4 flex text-right items-center bg-gray-50 text-sm text-nowrap text-foreground-primary font-medium">
          رنگ
        </div>
        <div className="w-2/3 p-4 border-r text-xs">{item.color}</div>
      </div>

      <div className="flex border-b">
        <div className="w-1/3 py-2 px-4 flex text-right items-center bg-gray-50 text-sm text-nowrap text-foreground-primary font-medium">
          قیمت
        </div>
        <div className="w-2/3 p-4 border-r text-xs">
          {priceFormatter(item.price, " تومان")}
        </div>
      </div>

      <div className="flex border-b">
        <div className="w-1/3 py-2 px-4 flex text-right items-center bg-gray-50 text-sm text-nowrap text-foreground-primary font-medium">
          تعداد
        </div>
        <div className="w-2/3 p-4 border-r text-xs">{item.quantity}</div>
      </div>

      <div className="flex">
        <div className="w-1/3 py-2 px-4 flex text-right items-center bg-gray-50 text-sm text-nowrap text-foreground-primary font-medium">
          مجموع
        </div>
        <div className="w-2/3 p-4 border-r text-xs">
          {priceFormatter(item.price * item.quantity, " تومان")}
        </div>
      </div>
    </div>
  );
}
