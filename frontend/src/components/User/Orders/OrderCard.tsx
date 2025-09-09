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
}: Props) {
  return (
    <div className="mb-3 flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 lg:hidden">
      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">محصول</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 px-3 py-2">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg">
            <Image
              src={image}
              alt={title}
              fill
              className="h-full w-full object-cover"
              sizes="48px"
            />
          </div>
          <span className="text-sm text-foreground-primary">{title}</span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">دسته بندی</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-sm text-foreground-primary">{category}</span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">تاریخ</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-sm text-foreground-primary">
            {time} - {date}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">قیمت</span>
        </div>

        <div className="col-span-3 flex items-center gap-1 p-3">
          <span className="text-sm text-foreground-primary">{price} تومان</span>
        </div>
      </div>

      <div className="grid grid-cols-4">
        <div className="flex items-center justify-start border-l border-slate-100 bg-stone-50 pr-3">
          <span className="text-sm text-foreground-primary">وضعیت</span>
        </div>

        <div className="col-span-3 flex items-center justify-between gap-1 p-3 pl-0">
          <div className="flex items-center gap-1">
            <div
              className={clsx(
                "flex h-6 w-6 items-center justify-center rounded-full",
                status === PersianOrderStatus.CANCELLED && "bg-red-500",
                status === PersianOrderStatus.INPROGRESS && "bg-yellow-500",
                status === PersianOrderStatus.DELIVERED && "bg-green-500",
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
            <ShowFactorButton />
          </div>
        </div>
      </div>
    </div>
  );
}
