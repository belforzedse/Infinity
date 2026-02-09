import React from "react";
import { render, screen } from "@testing-library/react";
import ShoppingCartBillPaymentGateway from "./PaymentGateway";

describe("ShoppingCartBillPaymentGateway", () => {
  const onChange = jest.fn();

  beforeEach(() => {
    onChange.mockReset();
  });

  it("renders SnappPay and Mellat when included in available gateways", () => {
    render(
      <ShoppingCartBillPaymentGateway
        selected="samankish"
        onChange={onChange}
        availableGateways={["samankish", "mellat", "snappay", "wallet"]}
      />,
    );

    expect(screen.getByText(/بانک ملت/)).toBeInTheDocument();
    expect(screen.getByText(/اسنپ/)).toBeInTheDocument();
  });

  it("hides SnappPay and Mellat when excluded from available gateways", () => {
    render(
      <ShoppingCartBillPaymentGateway
        selected="samankish"
        onChange={onChange}
        availableGateways={["samankish", "wallet"]}
      />,
    );

    expect(screen.queryByText(/بانک ملت/)).not.toBeInTheDocument();
    expect(screen.queryByText(/اسنپ/)).not.toBeInTheDocument();
  });

  it("keeps SnappPay visible but disabled when user is not eligible", () => {
    render(
      <ShoppingCartBillPaymentGateway
        selected="samankish"
        onChange={onChange}
        availableGateways={["samankish", "snappay"]}
        snappEligible={false}
      />,
    );

    const snappLabel = screen.getByText(/اسنپ/);
    const snappButton = snappLabel.closest("button");
    expect(snappButton).toBeInTheDocument();
    expect(snappButton).toHaveClass("opacity-50");
  });
});
