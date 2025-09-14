export const round = (n: number) => Math.round(Number(n || 0));

export const computeTax = (taxableAmount: number, taxPercent: number) => {
  return (taxableAmount * taxPercent) / 100;
};

export const computeTotals = (
  subtotal: number,
  discountAmount: number,
  taxPercent: number,
  shipping: number
) => {
  const tax = computeTax(subtotal - discountAmount, taxPercent);
  const total = subtotal - discountAmount + tax + shipping;
  return {
    subtotal: round(subtotal),
    discount: round(discountAmount),
    tax: round(tax),
    shipping: round(shipping),
    total: round(total),
  };
};
