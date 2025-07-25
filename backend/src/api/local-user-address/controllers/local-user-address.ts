/**
 * local-user-address controller
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::local-user-address.local-user-address",
  ({ strapi }) => ({
    // Get addresses for the current logged-in user
    async getMyAddresses(ctx) {
      try {
        const { user } = ctx.state;

        // Query addresses for the current user
        const { results: addresses, pagination } = await strapi
          .service("api::local-user-address.local-user-address")
          .find({
            filters: {
              user: user.id,
            },
            populate: {
              shipping_city: {
                populate: {
                  shipping_province: true,
                },
              },
            },
            sort: { createdAt: "desc" },
          });

        return { data: addresses, meta: { pagination } };
      } catch (error) {
        return ctx.badRequest("An error occurred while fetching addresses", {
          error: error.message,
        });
      }
    },

    // Create a new address for the authenticated user
    async createAddress(ctx) {
      try {
        const { user } = ctx.state;
        const { shipping_city, PostalCode, FullAddress, Description } =
          ctx.request.body;

        // Validate required fields
        if (!shipping_city) {
          return ctx.badRequest("Shipping city is required");
        }

        if (!PostalCode) {
          return ctx.badRequest("Postal code is required");
        }

        if (!FullAddress) {
          return ctx.badRequest("Full address is required");
        }

        // Validate postal code format (assuming it should be numeric and 10 digits)
        const postalCodeRegex = /^\d{10}$/;
        if (!postalCodeRegex.test(PostalCode)) {
          return ctx.badRequest("Postal code must be 10 digits");
        }

        // Check if shipping city exists
        const cityExists = await strapi.db
          .query("api::shipping-city.shipping-city")
          .findOne({
            where: { id: shipping_city },
          });

        if (!cityExists) {
          return ctx.badRequest("Invalid shipping city");
        }

        // Create the address
        const address = await strapi.entityService.create(
          "api::local-user-address.local-user-address",
          {
            data: {
              shipping_city,
              PostalCode,
              FullAddress,
              Description,
              user: user.id,
            },
            populate: {
              shipping_city: {
                populate: {
                  shipping_province: true,
                },
              },
            },
          }
        );

        return { data: address };
      } catch (error) {
        return ctx.badRequest("An error occurred while creating the address", {
          error: error.message,
        });
      }
    },
  })
);
