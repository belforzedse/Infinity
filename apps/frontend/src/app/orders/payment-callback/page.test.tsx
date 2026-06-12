import React from "react";
import { render, waitFor } from "@testing-library/react";
import { useCart } from "@/contexts/CartContext";
import { trackFunnelStep, trackMatomoEvent } from "@/lib/analytics/matomo";

const mockPush = jest.fn();
const mockClearCart = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => ({ ResNum: "123", RefNum: "abc" })[key] ?? null,
  }),
}));

jest.mock("@/services", () => ({
  OrderService: {
    verifyPayment: jest.fn(),
    getOrderPaymentStatus: jest.fn(),
  },
}));

jest.mock("jotai", () => ({
  atom: () => ({}),
  useAtom: () => [null, jest.fn()],
}));

jest.mock("@/contexts/CartContext", () => ({
  useCart: jest.fn(),
}));

jest.mock("@/lib/analytics/matomo", () => ({
  trackFunnelStep: jest.fn(),
  trackMatomoEvent: jest.fn(),
}));

import { OrderService } from "@/services";
import PaymentCallback from "./page";

const verifyPaymentMock = OrderService.verifyPayment as jest.Mock;
const paymentStatusMock = OrderService.getOrderPaymentStatus as jest.Mock;
const useCartMock = useCart as jest.Mock;
const trackFunnelStepMock = trackFunnelStep as jest.Mock;
const trackMatomoEventMock = trackMatomoEvent as jest.Mock;

describe("PaymentCallback page", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockClearCart.mockReset();
    mockClearCart.mockResolvedValue(undefined);
    useCartMock.mockReset();
    useCartMock.mockReturnValue({ clearCart: mockClearCart });
    trackFunnelStepMock.mockReset();
    trackMatomoEventMock.mockReset();
    verifyPaymentMock.mockReset();
    paymentStatusMock.mockReset();
    localStorage.clear();
  });

  it("verifies payment, clears checkout state, tracks success, and redirects", async () => {
    verifyPaymentMock.mockResolvedValue({
      orderId: 1,
      orderNumber: "A123",
      success: true,
    });
    paymentStatusMock.mockResolvedValue({ isPaid: true });

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<PaymentCallback />);

    await waitFor(() => {
      expect(verifyPaymentMock).toHaveBeenCalledWith(123, "abc");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/orders/success");
    });

    expect(paymentStatusMock).toHaveBeenCalledWith(1);
    expect(mockClearCart).toHaveBeenCalledTimes(1);
    expect(trackFunnelStepMock).toHaveBeenCalledWith("purchase", {
      label: "1",
      onceKey: "purchase:1",
    });
    expect(trackMatomoEventMock).toHaveBeenCalledWith({
      category: "checkout",
      action: "payment_callback_success",
      name: "verified",
      onceKey: "payment-callback-success:1",
    });
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
