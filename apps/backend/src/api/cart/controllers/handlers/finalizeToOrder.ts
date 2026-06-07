import { Strapi } from "@strapi/strapi";
import {
  cancelOrderAndRelease,
  ensurePaymentGateway,
  requestMellatPayment,
  requestSamanPayment,
  requestSnappPayment,
  requestZarinPalPayment,
} from "./gateway-helpers";
import {
  isCheckoutGatewayEnabled,
  normalizeCheckoutGatewayCode,
} from "../../../payment-gateway/services/checkout-gateway-availability";

export const finalizeToOrderHandler = (strapi: Strapi) => async (ctx: any) => {
  const { user } = ctx.state;
  const {
    shipping,
    shippingCost,
    description,
    note,
    callbackURL,
    addressId,
    addressPayload,
    gateway,
    mobile,
    discountCode,
    reserveShipping,
    reserveGroupId,
  } = ctx.request.body;

  try {
    let resolvedAddressId = addressId;
    let resolvedShippingId = shipping;
    let resolvedShippingCost = shippingCost;
    let reserveOrderData: {
      reserveGroupId: string;
      reserveExpiresAt: Date;
      isMerge: true;
    } | null = null;

    // When merging into existing reserve: get address/shipping from parent order
    if (reserveGroupId && typeof reserveGroupId === "string" && reserveGroupId.trim()) {
      const now = new Date();
      const parentOrders = await strapi.db.query("api::order.order").findMany({
        where: {
          user: { id: user.id },
          reserveGroupId: reserveGroupId.trim(),
          isReserveOrder: true,
          reserveExpiresAt: { $gt: now.toISOString() },
        },
        populate: { delivery_address: true, shipping: true },
        orderBy: { Date: "asc" },
      });
      if (parentOrders.length === 0) {
        return ctx.badRequest("سفارش رزروی معتبر یافت نشد یا منقضی شده است", {
          data: { success: false, errorCode: "RESERVE_NOT_FOUND", message: "سفارش رزروی معتبر یافت نشد یا منقضی شده است" },
        });
      }
      const parent = parentOrders[0];
      resolvedAddressId = parent.delivery_address?.id ?? parent.delivery_address;
      resolvedShippingId = parent.shipping?.id ?? parent.shipping;
      resolvedShippingCost = 0;
      reserveOrderData = {
        reserveGroupId: parent.reserveGroupId,
        reserveExpiresAt: new Date(parent.reserveExpiresAt),
        isMerge: true,
      };
    }

    // Validate required shipping information (skip when merging - we have it from parent)
    if (!reserveOrderData && !resolvedShippingId) {
      return ctx.badRequest("روش ارسال الزامی است", {
        data: {
          success: false,
          errorCode: "SHIPPING_REQUIRED",
          message: "روش ارسال الزامی است",
        },
      });
    }

    // Validate address is provided (skip when merging - we have it from parent)
    if (!reserveOrderData && !resolvedAddressId && !addressPayload) {
      return ctx.badRequest("آدرس تحویل الزامی است", {
        data: {
          success: false,
          errorCode: "ADDRESS_REQUIRED",
          message: "آدرس تحویل الزامی است",
        },
      });
    }

    // Verify shipping method exists and is valid (skip when merging)
    if (!reserveOrderData) {
      try {
        const shippingMethod = await strapi.entityService.findOne(
          "api::shipping.shipping",
          resolvedShippingId
        );
        if (!shippingMethod) {
          return ctx.badRequest("روش ارسال انتخاب شده معتبر نیست", {
            data: {
              success: false,
              errorCode: "INVALID_SHIPPING",
              message: "روش ارسال انتخاب شده معتبر نیست",
            },
          });
        }
      } catch (err) {
        strapi.log.error("Failed to validate shipping method:", err);
        return ctx.badRequest("خطا در بررسی روش ارسال", {
          data: {
            success: false,
            errorCode: "SHIPPING_VALIDATION_FAILED",
            message: "خطا در بررسی روش ارسال",
          },
        });
      }
    }

    // Handle inline address creation when provided (skip when merging)
    if (!reserveOrderData && !resolvedAddressId && addressPayload) {
      const { shipping_city, PostalCode, FullAddress, Description, save } = addressPayload;

      if (!shipping_city || !PostalCode || !FullAddress) {
        return ctx.badRequest("آدرس تحویل الزامی است", {
          data: {
            success: false,
            errorCode: "ADDRESS_REQUIRED",
            message: "آدرس تحویل الزامی است",
          },
        });
      }

      if (!/^\d{10}$/.test(String(PostalCode))) {
        return ctx.badRequest("کد پستی باید ۱۰ رقم باشد", {
          data: {
            success: false,
            errorCode: "INVALID_POSTAL_CODE",
            message: "کد پستی باید ۱۰ رقم باشد",
          },
        });
      }

      // Validate city exists
      const city = await strapi.entityService.findOne("api::shipping-city.shipping-city", shipping_city, {
        populate: { shipping_province: true },
      });

      if (!city) {
        return ctx.badRequest("شهر انتخاب شده معتبر نیست", {
          data: {
            success: false,
            errorCode: "INVALID_CITY",
            message: "شهر انتخاب شده معتبر نیست",
          },
        });
      }

      const addressData = {
        shipping_city,
        PostalCode: String(PostalCode),
        FullAddress: String(FullAddress),
        Description: Description || undefined,
        IsTemporary: !save,
        user: user.id,
      };

      try {
        const createdAddress = await strapi.entityService.create(
          "api::local-user-address.local-user-address",
          { data: addressData }
        );
        resolvedAddressId = createdAddress.id;
      } catch (err) {
        strapi.log.error("Failed to create inline address during finalize", err);
        return ctx.badRequest("خطا در ثبت آدرس", {
          data: {
            success: false,
            errorCode: "ADDRESS_CREATION_FAILED",
            message: "خطا در ثبت آدرس",
          },
        });
      }
    }

    // Verify address exists and belongs to user (skip when merging - parent address already validated)
    if (!reserveOrderData && resolvedAddressId) {
      try {
        const address = await strapi.entityService.findOne(
          "api::local-user-address.local-user-address",
          resolvedAddressId,
          { populate: { user: true, shipping_city: true } }
        );
        if (!address) {
          return ctx.badRequest("آدرس انتخاب شده یافت نشد", {
            data: {
              success: false,
              errorCode: "ADDRESS_NOT_FOUND",
              message: "آدرس انتخاب شده یافت نشد",
            },
          });
        }

        // Validate address ownership - critical security check
        const addressUserId =
          typeof address.user === "object" && address.user?.id
            ? address.user.id
            : typeof address.user === "number"
            ? address.user
            : null;

        if (!addressUserId || Number(addressUserId) !== Number(user.id)) {
          strapi.log.warn("Address ownership validation failed", {
            userId: user.id,
            addressId: resolvedAddressId,
            addressUserId,
            attempt: "unauthorized_address_access",
          });

          return ctx.badRequest("آدرس انتخاب شده متعلق به شما نیست", {
            data: {
              success: false,
              errorCode: "ADDRESS_UNAUTHORIZED",
              message: "آدرس انتخاب شده متعلق به شما نیست",
            },
          });
        }
      } catch (err) {
        strapi.log.error("Failed to validate address:", err);
        return ctx.badRequest("خطا در بررسی آدرس", {
          data: {
            success: false,
            errorCode: "ADDRESS_VALIDATION_FAILED",
            message: "خطا در بررسی آدرس",
          },
        });
      }
    }

    const shippingData: Record<string, unknown> = {
      shippingId: resolvedShippingId,
      shippingCost: resolvedShippingCost,
      description,
      note,
      addressId: resolvedAddressId,
      discountCode,
      reserveShipping: !!reserveShipping,
      reserveGroupId: reserveGroupId || undefined,
    };
    if (reserveOrderData) {
      shippingData.reserveOrderData = reserveOrderData;
    }

    const cartService = strapi.service("api::cart.cart");
    const result = await cartService.finalizeCartToOrder(user.id, shippingData);

    if (!result.success) {
      return ctx.badRequest(result.message, {
        data: {
          success: false,
          message: result.message,
          itemsRemoved: result.itemsRemoved,
          itemsAdjusted: result.itemsAdjusted,
          cart: result.cart,
        },
      });
    }

    const order = result.order;
    const contract = result.contract;
    const financialSummary = result.financialSummary;

    let totalAmount = contract.Amount || 0;

    strapi.log.info(`Processing payment for Order ${order.id}:`, {
      orderId: order.id,
      contractId: contract.id,
      totalAmount,
      userId: user.id,
      callbackURL: callbackURL || "/orders/payment-callback",
    });

    const requestedGateway = String(gateway || "mellat").toLowerCase();
    const selectedGateway =
      normalizeCheckoutGatewayCode(requestedGateway) || "mellat";

    const gatewayEnabled = await isCheckoutGatewayEnabled(strapi, selectedGateway);
    if (!gatewayEnabled) {
      return ctx.badRequest("درگاه پرداخت انتخاب‌شده غیرفعال است.", {
        data: {
          success: false,
          errorCode: "PAYMENT_GATEWAY_DISABLED",
          gateway: selectedGateway,
        },
      });
    }

    const paymentGatewayLabel =
      selectedGateway === "snappay"
        ? "SnappPay"
        : selectedGateway === "samankish"
        ? "SamanKish"
        : selectedGateway === "zarinpal"
        ? "ZarinPal"
        : selectedGateway === "wallet"
        ? "Wallet"
        : "Mellat";
    const baseUrl = process.env.URL || "https://api.infinitycolor.co/";
    const serverBaseUrl = `${baseUrl.replace(/\/$/, "")}/api`;
    const absoluteCallback = `${serverBaseUrl}${
      (callbackURL || "/orders/payment-callback").startsWith("/") ? "" : "/"
    }${callbackURL || "/orders/payment-callback"}`;

    try {
      await strapi.entityService.update("api::order.order", order.id, {
        data: { PaymentGateway: paymentGatewayLabel },
      });
    } catch (e) {
      strapi.log.error("Failed to update order payment gateway", {
        orderId: order.id,
        gateway: paymentGatewayLabel,
        error: (e as Error)?.message || e,
      });
    }

    // Wallet payment path (full wallet only)
    if (selectedGateway === "wallet") {
      // Compute total amount from contract (toman -> IRR inside wallet storage uses IRR)
      const totalToman = Math.round(contract.Amount || 0);
      const totalIrr = totalToman * 10;

      // Import atomic wallet deduction helper
      const { deductWalletBalanceAtomic } = await import(
        "../../../local-user-wallet/services/local-user-wallet"
      );

      // Atomically deduct wallet balance (prevents race conditions)
      const walletResult = await deductWalletBalanceAtomic(
        strapi,
        user.id,
        totalIrr
      );

      if (!walletResult.success) {
        strapi.log.warn("Wallet payment failed", {
          userId: user.id,
          orderId: order.id,
          amountRequired: totalIrr,
          error: walletResult.error,
        });

        // Cancel + release reservation (we haven't delivered anything yet)
        await cancelOrderAndRelease(
          strapi,
          order.id,
          contract.id,
          user.id,
          "wallet_payment_failed",
          { createAuditLogs: true }
        );

        return ctx.badRequest(walletResult.error || "Wallet balance is insufficient", {
          data: {
            success: false,
            error: "insufficient_wallet",
            message: walletResult.error,
          },
        });
      }

      strapi.log.info("Wallet balance deducted successfully", {
        userId: user.id,
        orderId: order.id,
        amountDeducted: totalIrr,
        newBalance: walletResult.newBalance,
        walletId: walletResult.walletId,
      });

      // Transaction record (Minus)
      let walletDebitTx: any = null;
      try {
        walletDebitTx = await strapi.entityService.create(
          "api::local-user-wallet-transaction.local-user-wallet-transaction",
          {
            data: {
              Amount: totalIrr,
              Type: "Minus",
              Date: new Date(),
              Cause: "Order Payment",
              ReferenceId: String(order.id),
              user_wallet: walletResult.walletId,
            },
          }
        );
      } catch (error) {
        strapi.log.error("Failed to persist wallet transaction entry", error);
      }

      // Persist contract transaction as settled (wallet)
      let walletGateway: any = null;
      try {
        walletGateway = await ensurePaymentGateway(strapi, "Wallet", {
          Description: "Infinity wallet balance",
        });
      } catch (error) {
        strapi.log.error("Failed to ensure wallet payment gateway", error);
      }

      const discountIrr = Math.round(Number(financialSummary?.discount || 0) * 10);
      const walletReference = walletDebitTx?.id
        ? `wallet-tx-${walletDebitTx.id}`
        : `wallet-${order.id}`;

      try {
        const contractTransactionData: any = {
          Type: "Gateway",
          Amount: totalIrr,
          DiscountAmount: discountIrr,
          Step: 1,
          Status: "Success",
          TrackId: walletReference,
          external_id: walletReference,
          external_source: "Wallet",
          contract: contract.id,
          Date: new Date(),
        };
        if (walletGateway?.id) {
          contractTransactionData.payment_gateway = walletGateway.id;
        }

        await strapi.entityService.create(
          "api::contract-transaction.contract-transaction",
          {
            data: contractTransactionData,
          }
        );
      } catch (error) {
        strapi.log.error("Failed to persist wallet contract transaction", error);
      }

      // Mark contract as confirmed
      try {
        await strapi.entityService.update("api::contract.contract", contract.id, {
          data: {
            Status: "Confirmed",
            external_source: "Wallet",
            external_id: walletReference,
          },
        });
      } catch (error) {
        strapi.log.error("Failed to confirm contract for wallet payment", error);
      }

      // Immediately mark order as paid (Started) and decrement stock (wallet is instant-settlement)
      try {
        const orderWithItems = await strapi.entityService.findOne(
          "api::order.order",
          order.id,
          {
            populate: {
              order_items: {
                populate: {
                  product_variation: { populate: { product_stock: true } },
                },
              },
            },
          }
        );

        // Import atomic stock decrement helper
        const { decrementStockAtomic } = await import(
          "../../services/lib/stock"
        );

        const stockErrors: any[] = [];
        for (const it of orderWithItems?.order_items || []) {
          const v = it?.product_variation;
          if (v?.product_stock?.id && typeof it?.Count === "number") {
            const stockId = v.product_stock.id as number;
            const quantity = Number(it.Count || 0);

            // Use atomic decrement to prevent race conditions
            const result = await decrementStockAtomic(strapi, stockId, quantity);

            if (!result.success) {
              stockErrors.push({
                stockId,
                quantity,
                error: result.error,
                variationId: v.id,
                productTitle: v.product?.Title,
              });
              strapi.log.error("Failed to decrement stock atomically", {
                orderId: order.id,
                stockId,
                quantity,
                error: result.error,
              });
            } else {
              strapi.log.info("Stock decremented successfully", {
                orderId: order.id,
                stockId,
                quantity,
                newCount: result.newCount,
              });
            }
          }
        }

        // If any stock decrements failed, log it but don't block the order
        // (wallet has already been charged at this point)
        if (stockErrors.length > 0) {
          strapi.log.error(
            "Some stock decrements failed for wallet payment - manual intervention may be required",
            {
              orderId: order.id,
              errors: stockErrors,
            }
          );

          // Create order log for tracking
          await strapi.entityService.create("api::order-log.order-log", {
            data: {
              order: order.id,
              Action: "Update",
              Description: "Stock decrement failures detected",
              Changes: { stockErrors: JSON.parse(JSON.stringify(stockErrors)) },
            },
          });
        }
      } catch (e) {
        strapi.log.error("Failed to decrement stock for wallet payment", e);
      }

      try {
        await strapi.entityService.update("api::order.order", order.id, {
          data: { Status: "Started" },
        });
      } catch (e) {
        strapi.log.error(
          "Failed to update order status to Started (wallet)",
          e
        );
      }

      // Write order-log
      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: order.id,
            Action: "Update",
            Description: "Wallet payment success (instant settlement)",
            Changes: { method: "wallet" },
          },
        });
      } catch {}

      try {
        await cartService.clearCart(user.id);
      } catch (err) {
        strapi.log.error("Failed to clear cart after wallet payment", err);
      }

      return {
        data: {
          success: true,
          message: "Order paid via wallet.",
          orderId: order.id,
          contractId: contract.id,
          redirectUrl: "",
          refId: "",
          financialSummary: financialSummary,
          requestId: "wallet",
          ...(order.reserveGroupId && { reserveGroupId: order.reserveGroupId }),
          ...(order.reserveExpiresAt && { reserveExpiresAt: order.reserveExpiresAt }),
        },
      };
    }

    let paymentResult: any = null;

    if (selectedGateway === "snappay") {
      const { response, paymentResult: pr } = await requestSnappPayment(
        strapi,
        ctx,
        {
          order,
          contract,
          financialSummary,
          userId: user.id,
          mobile,
          absoluteCallback,
        }
      );
      if (response) return response;
      paymentResult = pr;
    } else if (selectedGateway === "samankish") {
      const { paymentResult: pr } = await requestSamanPayment(strapi, {
        order,
        contract,
        financialSummary,
        callbackURL: callbackURL,
        userId: user.id,
        cellNumber: mobile || user?.Phone,
      });
      paymentResult = pr;
    } else if (selectedGateway === "zarinpal") {
      const { paymentResult: pr } = await requestZarinPalPayment(strapi, {
        order,
        contract,
        financialSummary,
        userId: user.id,
        mobile: mobile || user?.Phone,
      });
      paymentResult = pr;
    } else {
      paymentResult = await requestMellatPayment(strapi, {
        orderId: order.id,
        amount: totalAmount * 10,
        userId: user.id,
        callbackURL: callbackURL,
        contractId: contract.id,
      });
    }

    strapi.log.info(`Payment result for Order ${order.id}:`, {
      success: paymentResult?.success,
      error: paymentResult?.error,
      requestId: paymentResult?.requestId,
      hasDetailedError: !!paymentResult?.detailedError,
    });

    if (!paymentResult || !paymentResult.success) {
      const reqId = paymentResult?.requestId;
      const errMsg = paymentResult?.error || "Payment gateway error";
      const detailed = paymentResult?.detailedError || {};
      try {
        await strapi.entityService.create("api::order-log.order-log", {
          data: {
            order: order.id,
            performed_by: user.id,
            Action: "Update",
            Description: "Gateway payment request failed",
            Changes: {
              requestId: reqId,
              error: errMsg,
              userId: user.id,
            },
          },
        });
      } catch (e) {
        strapi.log.error("Failed to write order-log for gateway failure", {
          orderId: order.id,
          userId: user.id,
          error: (e as Error)?.message || e,
        });
      }

      await cancelOrderAndRelease(
        strapi,
        order.id,
        contract.id,
        user.id,
        "payment_gateway_failure",
        { createAuditLogs: true }
      );

      return ctx.badRequest(errMsg, {
        data: {
          success: false,
          error: errMsg,
          debug: detailed,
          requestId: reqId,
          timestamp: new Date().toISOString(),
          orderId: order.id,
          contractId: contract.id,
        },
      });
    }

    strapi.log.info(`Payment successful for Order ${order.id}:`, {
      redirectUrl: paymentResult.redirectUrl,
      refId: paymentResult.refId,
    });

    try {
      await strapi.entityService.create("api::order-log.order-log", {
        data: {
          order: order.id,
          Action: "Update",
          Description: `Gateway payment request initiated (${selectedGateway})`,
          Changes: {
            requestId: paymentResult.requestId,
            refId: paymentResult.refId,
            redirectUrl: paymentResult.redirectUrl,
          },
        },
      });
    } catch (e) {
      strapi.log.error("Failed to write order-log for gateway request", e);
    }

    // NOTE: Do not clear cart here. Cart will be cleared on gateway callback success.

    return {
      data: {
        success: true,
        message: "Order created successfully. Redirecting to payment gateway.",
        orderId: order.id,
        contractId: contract.id,
        redirectUrl: paymentResult.redirectUrl,
        refId: paymentResult.refId,
        financialSummary: financialSummary,
        requestId: paymentResult.requestId,
        ...(order.reserveGroupId && { reserveGroupId: order.reserveGroupId }),
        ...(order.reserveExpiresAt && { reserveExpiresAt: order.reserveExpiresAt }),
      },
    };
  } catch (error: any) {
    strapi.log.error("Error in finalizeToOrder:", {
      message: error.message,
      stack: error.stack,
      userId: user?.id,
      requestBody: ctx.request.body,
    });
    if (error?.status) {
      // Convert structured errors to ctx.badRequest() format per payment error guideline
      const errorCode =
        error?.payload?.data?.errorCode ||
        error.errorCode ||
        error.code ||
        "PAYMENT_ERROR";
      const message =
        error?.payload?.data?.message ||
        error.message ||
        error.error ||
        "خطا در پردازش درخواست";
      return ctx.badRequest(message, {
        data: {
          success: false,
          errorCode,
          message,
          timestamp: new Date().toISOString(),
          userId: user?.id,
        },
      });
    }
    return ctx.badRequest(error.message, {
      data: {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        userId: user?.id,
      },
    });
  }
};
