import React from "react";

interface PaymentActionsProps {
  handleBackToCart: () => void;
  handleContactSupport: () => void;
  handleContinueShopping: () => void;
}

export default function PaymentActions({
  handleBackToCart,
  handleContactSupport,
  handleContinueShopping,
}: PaymentActionsProps): React.ReactElement {
  return (
    <div className="w-full max-w-md space-y-3">
      <button
        type="button"
        onClick={handleBackToCart}
        className="w-full bg-pink-500 text-white py-3 px-6 rounded-lg text-center hover:bg-pink-600 transition-colors"
      >
        بازگشت به سبد خرید
      </button>
      <button
        type="button"
        onClick={handleContactSupport}
        className="w-full bg-gray-100 text-gray-800 py-3 px-6 rounded-lg text-center hover:bg-gray-200 transition-colors"
      >
        تماس با پشتیبانی
      </button>
      <button
        type="button"
        onClick={handleContinueShopping}
        className="w-full text-gray-700 py-3 px-6 rounded-lg text-center hover:bg-gray-50 transition-colors"
      >
        ادامه خرید
      </button>
    </div>
  );
}

