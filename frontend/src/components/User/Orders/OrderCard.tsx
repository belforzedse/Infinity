import Image from "next/image";
import CancelIcon from "../Icons/CancelIcon";
import TickIcon from "../Icons/TickIcon";
import { PersianOrderStatus } from "@/constants/enums";
import clsx from "clsx";
import ShowFactorButton from "./ShowFactorButton";
import PaymentStatusButton from "./PaymentStatusButton";

interface Props {
  image: string;
  category: string;
  date: string;
  time: string;
  price: string;
  status: PersianOrderStatus;
  title: string;
  orderId?: number;
  shippingBarcode?: string;
}

export default function OrderCard({
  image,
  category,
  date,
  time,
  price,
  status,
  title,
  orderId,
  shippingBarcode,
}: Props) {
  return (
    <div className="lg:hidden flex flex-col rounded-2xl border border-slate-100 mb-3 divide-y divide-slate-100 overflow-hidden">
      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">محصول</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 py-2 px-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg">
            <Image
              src={image}
              alt={title}
              fill
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-foreground-primary text-sm">{title}</span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">دسته بندی</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-foreground-primary text-sm">{category}</span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">تاریخ</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-foreground-primary text-sm">
            {time} - {date}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">قیمت</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-foreground-primary text-sm">{price} تومان</span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="bg-stone-50 border-l border-slate-100 flex items-center justify-start pr-3">
          <span className="text-foreground-primary text-sm">وضعیت</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3 pl-0 justify-between">
          <div className="flex items-center gap-1">
            <div
              className={clsx(
                "h-6 w-6 rounded-full flex items-center justify-center",
                status === PersianOrderStatus.CANCELLED && "bg-red-500",
                status === PersianOrderStatus.INPROGRESS && "bg-yellow-500",
                status === PersianOrderStatus.DELIVERED && "bg-green-500"
              )}
            >
              {status === PersianOrderStatus.CANCELLED ? (
                <CancelIcon />
              ) : (
                <TickIcon />
              )}
            </div>
            <span className="text-sm text-gray-700">{status}</span>
          </div>

          <div className="flex items-center gap-2">
            {orderId && <PaymentStatusButton orderId={orderId} />}
            {shippingBarcode ? (
              <a
                href={`https://anipo.ir/checkconsignment/?code=${shippingBarcode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                رهگیری مرسوله
              </a>
            ) : null}
            <ShowFactorButton />
          </div>
        </div>
      </div>
    </div>
  );
}
