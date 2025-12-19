import React from "react";
import PaymentStatus from "@/components/User/Orders/PaymentStatus";
import { translateOrderStatus } from "@/utils/statusTranslations";

interface PaymentOrderInfoProps {
  orderIdParam: string | null;
  code: string | null;
  statusLoading: boolean;
  orderStatus: string | null;
  isValidOrderId: boolean;
  parsedOrderId: number | null;
}

export default function PaymentOrderInfo({
  orderIdParam,
  code,
  statusLoading,
  orderStatus,
  isValidOrderId,
  parsedOrderId,
}: PaymentOrderInfoProps): React.ReactElement {
  if (!orderIdParam) return <></>;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6 w-full">
      <h3 className="text-lg font-semibold text-orange-800 mb-3">
        اطلاعات سفارش
      </h3>
      <div className="space-y-2 text-right">
        <p className="text-gray-700">
          <span className="font-medium">شماره سفارش:</span>
          <span className="mr-2 font-semibold text-orange-700">
            #{orderIdParam}
          </span>
        </p>
        {code && (
          <p className="text-gray-700">
            <span className="font-medium">کد خطا:</span>
            <span className="mr-2 font-semibold text-orange-700 break-all">
              {code}
            </span>
          </p>
        )}
        <p className="text-gray-700">
          <span className="font-medium">وضعیت:</span>
          <span className="mr-2 text-orange-700">
            {statusLoading
              ? "در حال بارگذاری..."
              : translateOrderStatus(orderStatus) || "نیاز به بررسی"}
          </span>
        </p>
      </div>

      {isValidOrderId && parsedOrderId !== null ? (
        <PaymentStatus orderId={parsedOrderId} />
      ) : (
      ) : (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 text-right">
            شماره سفارش نامعتبر است. لطفاً با پشتیبانی تماس بگیرید.
          </p>
        </div>
      )}
    </div>
  );
}

