import Image from "next/image";
import CancelIcon from "../Icons/CancelIcon";
import TickIcon from "../Icons/TickIcon";
import { PersianOrderStatus } from "@/constants/enums";
import ShowFactorButton from "./ShowFactorButton";
import clsx from "clsx";
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

export default function OrderRow({
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
    <tr className="hover:bg-gray-50">
      <td className="py-3 pl-4">
        <div className="flex items-center gap-1">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200">
            <Image
              src={image}
              alt={title}
              fill
              className="h-full w-full object-cover"
            />
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
      <td className="px-4 py-3 min-w-44">
        <div className="flex items-center gap-2">
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
      </td>
      <td className="py-3 text-left w-fit">
        <div className="flex items-center gap-2">
          {orderId && <PaymentStatusButton orderId={orderId} />}
          <ShowFactorButton />
        </div>
      </td>
    </tr>
  );
}
