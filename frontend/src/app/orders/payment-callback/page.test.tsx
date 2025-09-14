import React from "react";
import { render, waitFor } from "@testing-library/react";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
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

import { OrderService } from "@/services";
import PaymentCallback from "./page";

const verifyPaymentMock = OrderService.verifyPayment as jest.Mock;
const paymentStatusMock = OrderService.getOrderPaymentStatus as jest.Mock;

describe("PaymentCallback page", () => {
  beforeEach(() => {
    pushMock.mockReset();
    verifyPaymentMock.mockReset();
    paymentStatusMock.mockReset();
  });

  it("handles payment callback without console noise", async () => {
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
      expect(pushMock).toHaveBeenCalledWith("/orders/success");
    });

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
