export function validatePhone(ctx, phone: string) {
  if (!phone) {
    ctx.status = 400;
    ctx.body = {
      message: "phone is required",
    };
    return ctx;
  } else if (phone.length !== 11 || !phone.startsWith("09")) {
    ctx.status = 400;
    ctx.body = {
      message: "phone is invalid",
    };
    return ctx;
  }

  return 200;
}
