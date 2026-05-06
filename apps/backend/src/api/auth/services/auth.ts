/**
 * auth service
 */

import { RedisClient } from "../../..";

export default () => ({
  async hasUser(ctx, { phone }) {
    // Normalize phone to +98XXXXXXXXX format for consistent lookup
    let normalizedPhone = String(phone).trim();
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = `+98${normalizedPhone.substring(1)}`;
    }
    if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = `+${normalizedPhone}`;
    }

    const user = await strapi.query("plugin::users-permissions.user").findOne({
      where: {
        phone: {
          $endsWith: normalizedPhone.substring(1),
        },
      },
    });

    return !!user?.id;
  },
  async otp(ctx, { phone }) {
    try {
      // Normalize phone to +98XXXXXXXXX format for consistent lookup
      let normalizedPhone = String(phone).trim();
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = `+98${normalizedPhone.substring(1)}`;
      }
      if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = `+${normalizedPhone}`;
      }

      const merchant = await strapi.query("plugin::users-permissions.user").findOne({
        where: {
          phone: {
            $endsWith: normalizedPhone.substring(1),
          },
        },
      });

      const code = Math.random().toString().substring(2, 8);
      const otpToken =
        Number(new Date()).toString(36) +
        "." +
        Math.random().toString(36).substring(2);

      (await RedisClient).set(
        otpToken,
        JSON.stringify({
          code,
          merchant: merchant?.id,
          phone: normalizedPhone,
          IsVerified: merchant?.IsVerified,
        }),
        {
          EX: 300,
          NX: true,
        }
      );

      const smsStatus = await strapi
        .service("api::messaging.messaging")
        .sendSMS(ctx, {
          phone,
          message: code,
          isOTP: true,
        });

      if (smsStatus !== 200) {
        ctx.badGateway("Failed to send SMS");
        return;
      }

      return otpToken;
    } catch (err) {
      strapi.log.error(err);
      ctx.status = 500;
      ctx.body = {
        message: err.message,
      };
    }
  },
});
