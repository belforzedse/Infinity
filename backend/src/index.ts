import { createClient } from "redis";
import override from "./api/auth/documentation/1.0.0/overrides/auth.json";
import localUserOverride from "./api/local-user/documentation/1.0.0/overrides/local-user.json";

import productLifeCycles from "./api/product/lifecycles";
import productVariationLifeCycles from "./api/product-variation/lifecycles";

export const RedisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect()
  .then((client) => {
    console.log("Redis connected");
    return client;
  });

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    if (strapi.plugin("documentation")) {
      strapi
        .plugin("documentation")
        .service("override")
        .registerOverride(override, {});

      strapi
        .plugin("documentation")
        .service("override")
        .registerOverride(localUserOverride, {});
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe(productLifeCycles);
    strapi.db.lifecycles.subscribe(productVariationLifeCycles);
    // Migrate any existing local-users to plugin users by creating a bridge (idempotent)
    (async function migrateLocalUsers() {
      try {
        const localUsers = await strapi.entityService.findMany("api::local-user.local-user", {
          fields: ["id", "Phone", "IsVerified", "Password", "external_id", "external_source"],
        });

        const mapping: Record<number, number> = {};

        for (const lu of localUsers) {
          if (!lu?.Phone) continue;
          const normalizedPhone = String(lu.Phone).trim();

          // If already mapped, record mapping and continue
          const existingLocal = await strapi.entityService.findOne(
            "api::local-user.local-user",
            lu.id,
            { fields: ["strapi_user"] },
          );
          if (existingLocal?.strapi_user) {
            mapping[lu.id] = existingLocal.strapi_user as number;
            continue;
          }

          // Try to find existing plugin user by phone
          let upUser = await strapi
            .query("plugin::users-permissions.user")
            .findOne({ where: { phone: normalizedPhone } });
          if (!upUser) {
            const email = `${normalizedPhone.replace(/\D/g, "") || "user"}@placeholder.local`;
            // create plugin user; if legacy Password exists, set it so Strapi will hash it via lifecycle
            const createData: any = {
              username: normalizedPhone,
              email,
              phone: normalizedPhone,
              confirmed: !!lu.IsVerified,
              blocked: false,
              IsActive: lu.IsActive !== false,
            };
            if (lu?.Password) createData.password = lu.Password;
            if (lu?.external_id) createData.external_id = lu.external_id;
            if (lu?.external_source) createData.external_source = lu.external_source;

            upUser = await strapi.entityService.create("plugin::users-permissions.user", {
              data: createData,
            });
          }

          // Record mapping and update legacy local-user with bridge id
          mapping[lu.id] = upUser.id;
          await strapi.entityService.update("api::local-user.local-user", lu.id, {
            data: { strapi_user: upUser.id },
          });
        }

        // If we have mappings, update all related content that pointed to legacy local-user ids
        const legacyToPlugin = mapping;
        const localIds = Object.keys(legacyToPlugin).map((k) => Number(k));
        if (localIds.length > 0) {
          // helper to remap user FK for a content-type and attribute name
          async function remapRelation(contentType: string, attrName: string) {
            try {
              const items = await strapi.entityService.findMany(contentType, {
                filters: { [attrName]: { $in: localIds } },
                limit: 1000,
              });
              for (const it of items) {
                const oldVal = (it as any)[attrName];
                const newVal = legacyToPlugin[Number(oldVal)];
                if (newVal && Number(oldVal) !== Number(newVal)) {
                  await strapi.entityService.update(contentType, (it as any).id, {
                    data: { [attrName]: newVal },
                  });
                }
              }
            } catch (e) {
              strapi.log.error(`Failed to remap relation ${contentType}.${attrName}`, e);
            }
          }

          // List of content-type/attribute pairs to remap
          const remapList: Array<[string, string]> = [
            ["api::local-user-info.local-user-info", "user"],
            ["api::local-user-wallet.local-user-wallet", "user"],
            ["api::local-user-address.local-user-address", "user"],
            ["api::product-review.product-review", "user"],
            ["api::product-review-reply.product-review-reply", "user"],
            ["api::product-review-like.product-review-like", "user"],
            ["api::product-like.product-like", "user"],
            ["api::wallet-topup.wallet-topup", "user"],
            ["api::order.order", "user"],
            ["api::cart.cart", "user"],
            ["api::contract.contract", "local_user"],
          ];

          for (const [ct, attr] of remapList) {
            await remapRelation(ct, attr);
          }
        }
      } catch (e) {
        strapi.log.error("Failed to migrate local users to plugin users", e);
      }
    })();
    // Ensure plugin roles exist: Superadmin, Owner, Store manager, Customer
    (async function ensurePluginRoles() {
      try {
        const roles = [
          {
            name: "Superadmin",
            description: "Full access to the system (internal use)",
            type: "superadmin",
          },
          {
            name: "Store manager",
            description: "Manage store and orders, cannot manage user wallets",
            type: "store-manager",
          },
          { name: "Customer", description: "End customer role", type: "customer" },
        ];

        for (const r of roles) {
          try {
            const existing = await strapi
              .query("plugin::users-permissions.role")
              .findOne({ where: { name: r.name } });
            if (!existing) {
              const created = await strapi
                .query("plugin::users-permissions.role")
                .create({
                  name: r.name,
                  description: r.description,
                  type: r.type,
                });
              strapi.log.info(`✓ Created users-permissions role: ${r.name}`, { roleId: created.id });

              // Rebuild permissions for the newly created role
              try {
                await strapi.plugin("users-permissions").service("role").updatePermissions(created.id, {});
                strapi.log.info(`✓ Initialized permissions for role: ${r.name}`);
              } catch (permError) {
                strapi.log.warn(`Could not initialize permissions for role: ${r.name}`, { error: permError?.message });
              }
            } else {
              strapi.log.info(`✓ Role already exists: ${r.name}`, { roleId: existing.id });
            }
          } catch (roleError) {
            strapi.log.error(`✗ Failed to create role: ${r.name}`, {
              error: roleError?.message,
              details: roleError,
            });
          }
        }
      } catch (e) {
        strapi.log.error("✗ Failed to ensure plugin roles", {
          error: e?.message,
          details: e,
        });
      }
    })();
  },
};
