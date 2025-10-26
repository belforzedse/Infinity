export const round = (n: number) => Math.round(Number(n || 0));

export const computeTotals = (
  subtotal: number,
  discountAmount: number,
  shipping: number
) => {
  // Tax is completely disabled - always 0
  const total = subtotal - discountAmount + shipping;
  return {
    subtotal: round(subtotal),
    discount: round(discountAmount),
    tax: 0,
    shipping: round(shipping),
    total: round(total),
  };
};
