import Image from "next/image";
import CancelIcon from "../Icons/CancelIcon";
import TickIcon from "../Icons/TickIcon";
import { PersianOrderStatus } from "@/constants/enums";
import clsx from "clsx";
import PaymentStatusButton from "./PaymentStatusButton";
import ShowFactorButton from "./ShowFactorButton";
import { Eye } from "lucide-react";

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
  onViewDetails: () => void;
}

export default function OrderRow({
  image,
  category,
  date,
  time,
  price,
  status,
  title,
  orderId,
  shippingBarcode,
  onViewDetails,
}: Props) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="py-3 pl-4">
        <div className="flex items-center gap-1">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200">
            {image ? (
              <Image src={image} alt={title} fill className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <span className="text-xs text-gray-400">تصویر</span>
              </div>
            )}
          </div>
          <span className="text-xs text-neutral-800">{title}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-neutral-800">{category}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-neutral-800">
          {time} - {date}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-neutral-800">{price} تومان</span>
      </td>
      <td className="min-w-44 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              "flex h-6 w-6 items-center justify-center rounded-full",
              status === PersianOrderStatus.CANCELLED && "bg-red-500",
              status === PersianOrderStatus.INPROGRESS && "bg-yellow-500",
              status === PersianOrderStatus.DELIVERED && "bg-green-500",
            )}
          >
            {status === PersianOrderStatus.CANCELLED ? <CancelIcon /> : <TickIcon />}
          </div>
          <span className="text-sm text-gray-700">{status}</span>
        </div>
      </td>
      <td className="w-fit py-3 text-left">
        <div className="flex items-center gap-2">
          {orderId && <PaymentStatusButton orderId={orderId} />}
          {shippingBarcode ? (
            <a
              href={`https://anipo.ir/checkconsignment/?code=${shippingBarcode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs rounded-lg bg-blue-50 px-2 py-1 text-blue-700 transition-colors hover:bg-blue-100"
            >
              رهگیری مرسوله
            </a>
          ) : null}
          <button
            type="button"
            onClick={onViewDetails}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-pink-200 hover:text-pink-600"
          >
            <Eye className="h-4 w-4" />
            <span>جزئیات</span>
          </button>
          <ShowFactorButton />
        </div>
      </td>
    </tr>
  );
}
