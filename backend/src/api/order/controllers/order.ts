/**
 * order controller
 */

import { factories } from "@strapi/strapi";
import { Strapi } from "@strapi/strapi";

export default factories.createCoreController(
  "api::order.order",
  ({ strapi }: { strapi: Strapi }) => ({
    async generateAnipoBarcode(ctx) {
      const { id } = ctx.params;
      try {
        const order: any = await strapi.entityService.findOne(
          "api::order.order",
          Number(id),
          {
            populate: {
              user: true,
              delivery_address: {
                populate: {
                  shipping_city: { populate: { shipping_province: true } },
                },
              },
              order_items: {
                populate: {
                  product_variation: { populate: { product: true } },
                },
              },
            },
          }
        );

        if (!order) return ctx.notFound("order not found");
        if (order.ShippingBarcode) {
          return (ctx.body = {
            success: true,
            already: true,
            barcode: order.ShippingBarcode,
          });
        }

        // Compute weight based on items (default 100g each product if missing)
        let weight = 0;
        for (const it of order.order_items || []) {
          const product = it?.product_variation?.product;
          const w = Number(product?.Weight ?? 100) || 100;
          const count = Number(it?.Count || 0);
          weight += w * count;
        }
        if (weight <= 0) weight = 100;

        const address = order?.delivery_address;
        const cityName = address?.shipping_city?.Title || "";
        const provinceName =
          address?.shipping_city?.shipping_province?.Title || "";
        const provinceCode =
          address?.shipping_city?.shipping_province?.Code || "";

        if (!provinceCode || !cityName) {
          return ctx.badRequest("missing address province/city for anipo");
        }

        // Compute declared value (sum) from order items + shipping as fallback
        let sum = 0;
        for (const it of order.order_items || []) {
          const per = Number(it?.PerAmount || 0);
          const count = Number(it?.Count || 0);
          sum += per * count;
        }
        sum += Number(order?.ShippingCost || 0);
        const anipo = strapi.service("api::shipping.anipo") as any;
        const res = await anipo.getBarcode({
          orderId: Number(order.id),
          provinceCode,
          provinceName,
          cityName,
          name: address?.FullName || order?.user?.Phone || "کاربر",
          postcode: address?.PostalCode || "",
          nationalCode: "",
          callNumber: address?.Phone || order?.user?.Phone || "",
          address: address?.FullAddress || "",
          weight,
          boxSizeId: order?.ShippingBoxSizeId || undefined,
          isnonstandard: 0,
          sum,
        });

        if (!res?.ok || !res?.data) {
          return ctx.badRequest("anipo_barcode_error", { data: res });
        }

        const updateData: any = {
          ShippingBarcode: res.data.barcode,
          ShippingPostPrice: Number(res.data.postprice || 0),
          ShippingTax: Number(res.data.tax || 0),
          ShippingWeight: weight,
          ShippingBoxSizeId:
            res.data.boxSizeId || order?.ShippingBoxSizeId || 0,
        };
        await strapi.entityService.update("api::order.order", Number(id), {
          data: updateData as any,
        });

        ctx.body = { success: true, data: res.data };
      } catch (error: any) {
        strapi.log.error(
          `[anipo] generate barcode error orderId=${id} message=${error?.message}`
        );
        return ctx.badRequest("generate_barcode_failed", {
          data: { error: error?.message },
        });
      }
    },
    async verifyPayment(ctx) {
      // Mellat returns: ResCode, SaleOrderId, SaleReferenceId, RefId, OrderId
      const { ResCode, SaleOrderId, SaleReferenceId, RefId, OrderId } =
        ctx.request.body;

      // SnappPay callback fields may arrive via POST body or GET query
      // Normalize from both sources and accept common aliases
      const q: any = (ctx.request as any).query || {};
      const b: any = (ctx.request as any).body || {};
      const state: string | undefined = (b.state ?? q.state) as any;
      const paymentTokenInput: string | undefined = (b.paymentToken ??
        q.paymentToken ??
        b.payment_token ??
        q.payment_token) as any;
      const transactionIdInput: string | undefined = (b.transactionId ??
        q.transactionId ??
        b.transaction_id ??
        q.transaction_id) as any;

      try {
        // Log raw request payload and query for diagnostics
        try {
          strapi.log.info("Payment callback raw input");
          strapi.log.info(
            JSON.stringify(
              {
                method: (ctx.request as any).method,
                ip: (ctx.request as any).ip,
                query: (ctx.request as any).query,
                body: (ctx.request as any).body,
                headers: {
                  "content-type": ctx.request.header["content-type"],
                  "user-agent": ctx.request.header["user-agent"],
                  "x-forwarded-for": ctx.request.header["x-forwarded-for"],
                },
                timestamp: new Date().toISOString(),
              },
              null,
              2
            )
          );
        } catch {}

        // Log all callback parameters for debugging
        strapi.log.info("Payment callback received:", {
          ResCode,
          SaleOrderId,
          SaleReferenceId,
          RefId,
          OrderId,
          state,
          paymentToken: paymentTokenInput,
          transactionId: transactionIdInput,
          timestamp: new Date().toISOString(),
        });

        // If this is a SnappPay flow (state provided or paymentToken present), follow SnappPay verify+settle
        if (state || paymentTokenInput || transactionIdInput) {
          // Resolve orderId and token using transactionId first (exact match), then fallback to paymentToken
          let orderId: number | undefined = OrderId
            ? parseInt(OrderId, 10)
            : undefined;
          let chosenTx: any | undefined;

          try {
            if (!orderId && transactionIdInput) {
              const exactByTx = (await strapi.entityService.findMany(
                "api::contract-transaction.contract-transaction",
                {
                  filters: {
                    external_source: "SnappPay",
                    external_id: transactionIdInput,
                  },
                  populate: { contract: { populate: { order: true } } },
                  sort: { createdAt: "desc" },
                  limit: 1,
                }
              )) as any[];
              if (exactByTx?.length) {
                chosenTx = exactByTx[0];
                const co = chosenTx?.contract?.order;
                orderId =
                  typeof co === "object" && co ? Number(co.id) : Number(co);
              }
            }

            if (!orderId && paymentTokenInput) {
              const byToken = (await strapi.entityService.findMany(
                "api::contract-transaction.contract-transaction",
                {
                  filters: {
                    external_source: "SnappPay",
                    TrackId: paymentTokenInput,
                  },
                  populate: { contract: { populate: { order: true } } },
                  sort: { createdAt: "desc" },
                  limit: 1,
                }
              )) as any[];
              if (byToken?.length) {
                chosenTx = byToken[0];
                const co = chosenTx?.contract?.order;
                orderId =
                  typeof co === "object" && co ? Number(co.id) : Number(co);
              }
            }
          } catch (e) {
            strapi.log.error(
              "Failed to resolve order from SnappPay transaction",
              e
            );
          }

          if (!orderId || isNaN(orderId)) {
            return ctx.badRequest("Invalid order ID", {
              data: {
                success: false,
                error: "Invalid order ID (SnappPay)",
                debug: {
                  transactionId: transactionIdInput,
                  paymentToken: paymentTokenInput,
                },
              },
            });
          }

          // SnappPay requires verify then settle using saved paymentToken (or from request)
          const snappay = strapi.service("api::payment-gateway.snappay");
          let tokenForOps = paymentTokenInput as string | undefined;
          if (!tokenForOps && chosenTx?.TrackId) tokenForOps = chosenTx.TrackId;
          if (!tokenForOps) {
            // Fallback: lookup by orderId to fetch recent transaction
            try {
              const txForOrder = (await strapi.entityService.findMany(
                "api::contract-transaction.contract-transaction",
                {
                  filters: {
                    external_source: "SnappPay",
                    contract: { order: { id: orderId } },
                  },
                  sort: { createdAt: "desc" },
                  limit: 1,
                }
              )) as any[];
              tokenForOps = txForOrder?.[0]?.TrackId;
              if (!chosenTx && txForOrder?.length) chosenTx = txForOrder[0];
            } catch {}
          }

          if (!tokenForOps) {
            return ctx.badRequest("Missing payment token for SnappPay", {
              data: { success: false, error: "Missing paymentToken" },
            });
          }

          // Log resolved identifiers
          try {
            strapi.log.info("SnappPay callback identifiers", {
              resolvedOrderId: orderId,
              tokenForOps,
              incomingPaymentToken: paymentTokenInput,
              incomingTransactionId: transactionIdInput,
              state,
            });
          } catch {}

          // On callback, state OK => verify+settle; FAILED => revert
          if (String(state || "OK").toUpperCase() !== "OK") {
            const revertResult = await snappay.revert(tokenForOps);
            await strapi.entityService.update("api::order.order", orderId, {
              data: { Status: "Cancelled" },
            });
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "SnappPay callback FAILED (revert)",
                  Changes: { state, transactionId: transactionIdInput },
                },
              });
            } catch {}
            return ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}`
            );
          }

          const verifyResult = await snappay.verify(tokenForOps);
          try {
            strapi.log.info("SnappPay verify result", {
              successful: verifyResult?.successful,
              error: verifyResult?.errorData,
            });
          } catch {}
          if (!verifyResult?.successful) {
            await strapi.entityService.update("api::order.order", orderId, {
              data: { Status: "Cancelled" },
            });
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "SnappPay verify failed",
                  Changes: { verifyResult },
                },
              });
            } catch {}
            return ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}`
            );
          }

          const settleResult = await snappay.settle(tokenForOps);
          try {
            strapi.log.info("SnappPay settle result", {
              successful: settleResult?.successful,
              error: settleResult?.errorData,
            });
          } catch {}
          if (settleResult?.successful) {
            // Decrement stock for each order item NOW (after settlement)
            try {
              const orderWithItems = await strapi.entityService.findOne(
                "api::order.order",
                orderId,
                {
                  populate: {
                    order_items: {
                      populate: {
                        product_variation: {
                          populate: { product_stock: true },
                        },
                      },
                    },
                  },
                }
              );
              // TODO: Consider wrapping stock decrements and status update in a transaction for atomicity
              for (const it of orderWithItems?.order_items || []) {
                const v = it?.product_variation;
                if (v?.product_stock?.id && typeof it?.Count === "number") {
                  const stockId = v.product_stock.id as number;
                  const current = Number(v.product_stock.Count || 0);
                  const dec = Number(it.Count || 0);
                  await strapi.entityService.update(
                    "api::product-stock.product-stock",
                    stockId,
                    { data: { Count: current - dec } }
                  );
                }
              }
            } catch (e) {
              strapi.log.error("Failed to decrement stock after settlement", e);
            }

            await strapi.entityService.update("api::order.order", orderId, {
              data: { Status: "Started" },
            });
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "SnappPay callback success (verify+settle)",
                  Changes: { transactionId: transactionIdInput },
                },
              });
            } catch {}
            return ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/success?orderId=${orderId}`
            );
          } else {
            await strapi.entityService.update("api::order.order", orderId, {
              data: { Status: "Cancelled" },
            });
            return ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}`
            );
          }
        }

        // Check if payment was successful (ResCode = 0) - Mellat
        if (ResCode !== "0") {
          // Handle different failure scenarios
          const orderId = parseInt(OrderId || SaleOrderId, 10);

          // Update order status to Cancelled if we have a valid order ID
          if (!isNaN(orderId)) {
            try {
              await strapi.entityService.update("api::order.order", orderId, {
                data: { Status: "Cancelled" },
              });
              strapi.log.info(
                `Order ${orderId} marked as Cancelled due to payment failure/cancellation`
              );
            } catch (updateError) {
              strapi.log.error(
                `Failed to update order ${orderId} status:`,
                updateError
              );
            }
          }

          // Log the specific error/cancellation
          // Audit log for gateway callback failure/cancellation
          try {
            if (!isNaN(orderId)) {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "Gateway callback failure/cancellation",
                  Changes: { ResCode, SaleOrderId, SaleReferenceId, RefId },
                },
              });
            }
          } catch (e) {
            strapi.log.error("Failed to persist gateway failure log", e);
          }

          if (ResCode === "17") {
            strapi.log.info("Payment cancelled by user:", { orderId, ResCode });
            // User cancelled - redirect to frontend cancellation page
            ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/cancelled?orderId=${orderId}&reason=user-cancelled`
            );
          } else {
            strapi.log.error("Payment failed with ResCode:", ResCode);
            // Other payment failures - redirect to frontend failure page
            ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?orderId=${orderId}&error=${encodeURIComponent(
                `Payment failed with code: ${ResCode}`
              )}`
            );
          }
          return;
        }

        // Call the Mellat service to verify the transaction (using mellat-checkout package)
        const paymentService = strapi.service("api::payment-gateway.mellat-v3");
        const verificationResult = await paymentService.verifyTransaction({
          orderId: OrderId || SaleOrderId,
          saleOrderId: SaleOrderId,
          saleReferenceId: SaleReferenceId,
        });

        if (verificationResult.success) {
          // Get the order from OrderId
          const orderId = parseInt(OrderId || SaleOrderId, 10);
          if (isNaN(orderId)) {
            return ctx.badRequest("Invalid order ID", {
              data: {
                success: false,
                error: "Invalid order ID",
              },
            });
          }

          // Settle the transaction
          const settlementResult = await paymentService.settleTransaction({
            orderId: OrderId || SaleOrderId,
            saleOrderId: SaleOrderId,
            saleReferenceId: SaleReferenceId,
          });

          if (settlementResult.success) {
            // Update order status to Started (Paid)
            // Decrement stock for each order item NOW (after settlement)
            try {
              const orderWithItems = await strapi.entityService.findOne(
                "api::order.order",
                orderId,
                {
                  populate: {
                    order_items: {
                      populate: {
                        product_variation: {
                          populate: { product_stock: true },
                        },
                      },
                    },
                  },
                }
              );
              for (const it of orderWithItems?.order_items || []) {
                const v = it?.product_variation;
                if (v?.product_stock?.id && typeof it?.Count === "number") {
                  const stockId = v.product_stock.id as number;
                  const current = Number(v.product_stock.Count || 0);
                  const dec = Number(it.Count || 0);
                  await strapi.entityService.update(
                    "api::product-stock.product-stock",
                    stockId,
                    { data: { Count: current - dec } }
                  );
                }
              }
            } catch (e) {
              strapi.log.error("Failed to decrement stock after settlement", e);
            }

            await strapi.entityService.update("api::order.order", orderId, {
              data: {
                Status: "Started",
              },
            });

            strapi.log.info(`Payment successful for Order ${orderId}:`, {
              orderId,
              ResCode,
              SaleReferenceId,
              settlementResult: settlementResult.resCode,
            });

            // Audit log for successful payment callback
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "Gateway callback success (verify+settle)",
                  Changes: { ResCode, SaleOrderId, SaleReferenceId, RefId },
                },
              });
            } catch (e) {
              strapi.log.error("Failed to persist gateway success log", e);
            }

            // Redirect to frontend success page
            ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/success?orderId=${orderId}`
            );
          } else {
            // Settlement failed
            console.error("Payment settlement failed:", settlementResult.error);
            try {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "Gateway settlement failed",
                  Changes: {
                    error: settlementResult.error,
                    SaleOrderId,
                    SaleReferenceId,
                    RefId,
                  },
                },
              });
            } catch (e) {
              strapi.log.error(
                "Failed to persist gateway settlement failure log",
                e
              );
            }
            ctx.redirect(
              `https://infinity.rgbgroup.ir/payment/failure?error=${encodeURIComponent(
                settlementResult.error || "Settlement failed"
              )}`
            );
          }
        } else {
          // Log the failure
          console.error(
            "Payment verification failed:",
            verificationResult.error
          );
          try {
            const orderId = parseInt(OrderId || SaleOrderId, 10);
            if (!isNaN(orderId)) {
              await strapi.entityService.create("api::order-log.order-log", {
                data: {
                  order: orderId,
                  Action: "Update",
                  Description: "Gateway verification failed",
                  Changes: {
                    error: verificationResult.error,
                    SaleOrderId,
                    SaleReferenceId,
                    RefId,
                  },
                },
              });
            }
          } catch (e) {
            strapi.log.error(
              "Failed to persist gateway verification failure log",
              e
            );
          }

          // Redirect to frontend failure page
          ctx.redirect(
            `https://infinity.rgbgroup.ir/payment/failure?error=${encodeURIComponent(
              verificationResult.error
            )}`
          );
        }
      } catch (error) {
        console.error("Error in payment verification callback:", error);
        try {
          const orderId = parseInt(OrderId || SaleOrderId, 10);
          if (!isNaN(orderId)) {
            await strapi.entityService.create("api::order-log.order-log", {
              data: {
                order: orderId,
                Action: "Update",
                Description: "Gateway callback internal error",
                Changes: { message: error.message },
              },
            });
          }
        } catch (e) {
          strapi.log.error("Failed to persist gateway internal error log", e);
        }
        ctx.redirect(
          `https://infinity.rgbgroup.ir/payment/failure?error=${encodeURIComponent(
            "Internal server error"
          )}`
        );
      }
    },

    async checkPaymentStatus(ctx) {
      const { id } = ctx.params;
      const { user } = ctx.state;

      try {
        // Verify that the order belongs to the user
        const order = await strapi.db.query("api::order.order").findOne({
          where: { id, user: { id: user.id } },
        });

        if (!order) {
          return ctx.forbidden(
            "You do not have permission to access this order",
            {
              data: {
                success: false,
                error: "You do not have permission to access this order",
              },
            }
          );
        }

        // Return the order payment status
        return {
          data: {
            success: true,
            orderId: order.id,
            status: order.Status,
            isPaid: ["Started", "Shipment", "Done"].includes(order.Status),
          },
        };
      } catch (error) {
        console.error("Error checking payment status:", error);
        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },

    async getMyOrders(ctx) {
      const { user } = ctx.state;

      // Get pagination parameters from query
      const { page = 1, pageSize = 10 } = ctx.query;

      try {
        // Prepare filters
        const filters = {
          user: { id: user.id },
        };

        // Count total orders
        const totalOrders = await strapi.db.query("api::order.order").count({
          where: filters,
        });

        // Calculate pagination values
        const pageNumber = parseInt(page, 10);
        const limit = parseInt(pageSize, 10);
        const start = (pageNumber - 1) * limit;
        const pageCount = Math.ceil(totalOrders / limit);

        // Get orders with pagination
        const orders = await strapi.db.query("api::order.order").findMany({
          where: filters,
          populate: {
            order_items: {
              populate: {
                product_variation: {
                  populate: {
                    product_color: true,
                    product_size: true,
                    product_variation_model: true,
                    product: {
                      populate: ["cover_image"],
                    },
                  },
                },
              },
            },
            shipping: true,
          },
          orderBy: { Date: "desc" },
          limit,
          offset: start,
        });

        // Return orders with pagination metadata
        return {
          data: orders,
          meta: {
            pagination: {
              page: pageNumber,
              pageSize: limit,
              pageCount,
              total: totalOrders,
            },
          },
        };
      } catch (error) {
        console.error("Error fetching user orders:", error);
        return ctx.badRequest(error.message, {
          data: {
            success: false,
            error: error.message,
          },
        });
      }
    },
  })
);
