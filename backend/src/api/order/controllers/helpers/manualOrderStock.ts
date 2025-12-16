import type { Strapi } from "@strapi/strapi";

/**
 * Decrement stock for manual orders
 * This is called after a manual order is created and items are added
 */
export async function decrementManualOrderStockHandler(strapi: Strapi, ctx: any) {
  const { id } = ctx.params;
  let orderId: number | undefined;

  try {
    // Admin guard: ensure plugin user has an admin/store-manager role
    const pluginUser = ctx.state.user;
    if (!pluginUser) {
      ctx.status = 403;
      ctx.body = {
        data: {
          success: false,
          error: "Admin access required",
        },
      };
      return;
    }

    const fullUser = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { id: pluginUser.id }, populate: ["role"] });

    const roleName = fullUser?.role?.name;
    if (!fullUser || (roleName !== "Superadmin" && roleName !== "Store manager")) {
      ctx.status = 403;
      ctx.body = {
        data: {
          success: false,
          error: "Admin access required",
        },
      };
      return;
    }

    orderId = Number(id);
    if (Number.isNaN(orderId)) {
      ctx.status = 400;
      ctx.body = {
        data: {
          success: false,
          error: "Invalid order ID",
        },
      };
      return;
    }

    // Load order with populated items and stock information
    const order = await strapi.entityService.findOne("api::order.order", orderId, {
      populate: {
        order_items: {
          populate: {
            product_variation: {
              populate: {
                product_stock: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      ctx.status = 404;
      ctx.body = {
        data: {
          success: false,
          error: "Order not found",
        },
      };
      return;
    }

    // Verify this is a manual order
    if (order.Type !== "Manual") {
      ctx.status = 400;
      ctx.body = {
        data: {
          success: false,
          error: "This endpoint is only for manual orders",
        },
      };
      return;
    }

    // Check if order has items
    if (!order.order_items || order.order_items.length === 0) {
      strapi.log.warn("Manual order has no items to process stock for", { orderId });
      ctx.status = 200;
      ctx.body = {
        data: {
          success: true,
          message: "Order has no items to process",
          results: [],
        },
      };
      return;
    }

    const { decrementStockAtomic } = await import("../../../cart/services/lib/stock");

    const stockErrors: any[] = [];
    const stockResults: any[] = [];

    // Decrement stock for each order item
    for (const item of order.order_items) {
      const variation = item.product_variation;

      if (!variation?.product_stock?.id || typeof item.Count !== "number" || item.Count <= 0) {
        if (!variation?.product_stock?.id) {
          strapi.log.warn("Order item has no stock association", {
            orderItemId: item.id,
            variationId: variation?.id,
          });
        }
        continue;
      }

      const stockId = variation.product_stock.id as number;
      const quantity = Number(item.Count || 0);

      const result = await decrementStockAtomic(strapi, stockId, quantity);

      if (result.success) {
        stockResults.push({
          stockId,
          quantity,
          newCount: result.newCount,
          variationId: variation?.id,
        });
      } else {
        stockErrors.push({
          stockId,
          quantity,
          error: result.error,
          variationId: variation?.id,
        });
        strapi.log.error("Failed to decrement stock atomically (manual order)", {
          orderId,
          stockId,
          quantity,
          error: result.error,
        });
      }
    }

    if (stockErrors.length > 0) {
      strapi.log.error("Some stock decrements failed for manual order", {
        orderId,
        errors: stockErrors,
        successfulCount: stockResults.length,
        failedCount: stockErrors.length,
      });

      // Return partial success - some items were processed, some failed
      // Use ctx.send instead of ctx.ok for better compatibility
      ctx.status = 200;
      ctx.body = {
        data: {
          success: true,
          partial: true,
          message: "Stock decremented with some errors",
          results: stockResults,
          errors: stockErrors,
        },
      };
      return;
    }

    if (stockResults.length === 0) {
      strapi.log.warn("No stock items were processed for manual order", {
        orderId,
        orderItemsCount: order.order_items?.length || 0,
      });
      ctx.status = 200;
      ctx.body = {
        data: {
          success: true,
          message: "No stock items to decrement",
          results: [],
        },
      };
      return;
    }

    strapi.log.info("Stock decremented successfully for manual order", {
      orderId,
      itemsProcessed: stockResults.length,
    });

    ctx.status = 200;
    ctx.body = {
      data: {
        success: true,
        message: "Stock decremented successfully",
        results: stockResults,
      },
    };
    return;
  } catch (error) {
    strapi.log.error("Failed to decrement stock for manual order", {
      orderId: orderId || id,
      rawId: id,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    ctx.status = 500;
    ctx.body = {
      data: {
        success: false,
        error: (error as Error).message,
      },
    };
    return;
  }
}

