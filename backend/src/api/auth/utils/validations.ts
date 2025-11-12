export function validatePhone(ctx, phone: string) {
  if (!phone) {
    ctx.status = 400;
    ctx.body = {
      message: "phone is required",
    };
    return ctx;
  }

  // Accept both formats:
  // - 09XXXXXXXXX (11 digits starting with 0)
  // - +989XXXXXXXXX (international format with +98)
  const isValid =
    (phone.length === 11 && phone.startsWith("09")) ||
    (phone.length === 13 && phone.startsWith("+98"));

  if (!isValid) {
    ctx.status = 400;
    ctx.body = {
      message: "phone is invalid",
    };
    return ctx;
  }

  return 200;
}
