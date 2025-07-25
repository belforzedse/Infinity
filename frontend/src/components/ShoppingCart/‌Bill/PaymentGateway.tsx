import React, { useState } from "react";
import Image from "next/image";
import classNames from "classnames";

function ShoppingCartBillPaymentGateway() {
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState<
    number | null
  >(null);

  const paymentGateways = [
    {
      id: 1,
      name: "زرین پال",
      img: "/images/cart/zarinpal.jpeg",
    },
    {
      id: 2,
      name: "سامان",
      img: "/images/cart/saman.png",
    },
    {
      id: 3,
      name: "ملت",
      img: "/images/cart/melat.png",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <span className="text-neutral-800 lg:text-xl text-2xl">
        درگاه پرداخت خود را انتخاب کنید
      </span>

      <div className="flex items-center gap-2">
        {paymentGateways.map((paymentGateway) => (
          <button
            key={paymentGateway.id}
            onClick={() => setSelectedPaymentGateway(paymentGateway.id)}
            className={classNames(
              "bg-stone-50 p-4 rounded-lg text-nowrap w-full border border-stone-50 flex items-center flex-col gap-2",
              selectedPaymentGateway === paymentGateway.id && "!border-pink-600"
            )}
          >
            <div className="w-16 h-16 relative">
              <Image
                src={paymentGateway.img}
                alt={paymentGateway.name}
                fill
                className="object-cover"
              />
            </div>

            <span className="text-neutral-600 lg:text-xs text-sm">
              {paymentGateway.name} درگاه پرداخت
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ShoppingCartBillPaymentGateway;
