import { createClient } from "redis";
import type { Strapi } from "@strapi/strapi";
import override from "./api/auth/documentation/1.0.0/overrides/auth.json";
import localUserOverride from "./api/local-user/documentation/1.0.0/overrides/local-user.json";

import productLifeCycles from "./api/product/lifecycles";
import productVariationLifeCycles from "./api/product-variation/lifecycles";
import { ensureIranLocations } from "./jobs/ensureLocations";

type ControllerActions = Record<string, ReadonlyArray<string> | "*">;
type FullAccessSpec = { mode: "all" };
type GranularSpec = {
  mode?: undefined;
  inherits?: string[];
  grants: Record<string, ControllerActions>;
};
type RolePermissionSpec = FullAccessSpec | GranularSpec;

const READ_ACTIONS = ["find", "findOne"] as const;

const ROLE_PERMISSION_SPECS: Record<string, RolePermissionSpec> = {
  public: {
    grants: {
      "api::auth": {
        auth: ["welcome", "otp", "login", "loginWithPassword", "resetPassword"],
      },
      "api::product": {
        product: [...READ_ACTIONS, "search"],
      },
      "api::product-category": {
        "product-category": READ_ACTIONS,
      },
      "api::product-category-content": {
        "product-category-content": READ_ACTIONS,
      },
      "api::product-faq": {
        "product-faq": READ_ACTIONS,
      },
      "api::product-size-helper": {
        "product-size-helper": READ_ACTIONS,
      },
      "api::product-tag": {
        "product-tag": READ_ACTIONS,
      },
      "api::product-variation": {
        "product-variation": READ_ACTIONS,
      },
      "api::product-variation-color": {
        "product-variation-color": READ_ACTIONS,
      },
      "api::product-variation-model": {
        "product-variation-model": READ_ACTIONS,
      },
      "api::product-variation-size": {
        "product-variation-size": READ_ACTIONS,
      },
      "api::product-stock": {
        "product-stock": READ_ACTIONS,
      },
      "api::cart-item": {
        "cart-item": READ_ACTIONS,
      },
      "api::product-review": {
        "product-review": READ_ACTIONS,
      },
      "api::product-review-reply": {
        "product-review-reply": READ_ACTIONS,
      },
      "api::product-review-like": {
        "product-review-like": READ_ACTIONS,
      },
      "api::navigation": {
        navigation: ["find"],
      },
      "api::footer": {
        footer: ["find"],
      },
      "api::shipping": {
        shipping: READ_ACTIONS,
      },
      "api::shipping-city": {
        "shipping-city": READ_ACTIONS,
      },
      "api::shipping-province": {
        "shipping-province": READ_ACTIONS,
      },
      "api::order": {
        order: ["verifyPayment"],
      },
      "api::wallet-topup": {
        "wallet-topup": ["paymentCallback"],
      },
    },
  },
  customer: {
    inherits: ["public"],
    grants: {
      "api::auth": {
        auth: ["self", "registerInfo"],
      },
      "api::cart": {
        cart: [
          "getMyCart",
          "addItem",
          "updateItem",
          "removeItem",
          "checkStock",
          "applyDiscount",
          "finalizeToOrder",
          "shippingPreview",
        ],
      },
      "api::product-like": {
        "product-like": ["toggleFavorite", "getUserLikes"],
      },
      "api::product-stock": {
        "product-stock": READ_ACTIONS,
      },
      "api::product-review": {
        "product-review": ["submitReview", "getUserReviews"],
      },
      "api::order": {
        order: ["getMyOrders", "getMyOrderDetail", "checkPaymentStatus"],
      },
      "api::local-user-address": {
        "local-user-address": [
          "find",
          "findOne",
          "create",
          "update",
          "delete",
          "getMyAddresses",
          "createAddress",
        ],
      },
      "api::local-user-wallet": {
        "local-user-wallet": ["getCurrentUserWallet"],
      },
      "api::wallet-topup": {
        "wallet-topup": ["chargeIntent"],
      },
      "api::payment-gateway": {
        "payment-gateway": ["snappEligible"],
      },
    },
  },
  "store-manager": { mode: "all" },
  superadmin: { mode: "all" },
};

type RestrictedController = {
  typeKey: string;
  controller: string;
  allowActions?: ReadonlyArray<string>;
};

const STORE_MANAGER_RESTRICTED_CONTROLLERS: RestrictedController[] = [
  { typeKey: "api::report", controller: "report" },
  {
    typeKey: "api::discount",
    controller: "discount",
    allowActions: READ_ACTIONS,
  },
  {
    typeKey: "api::product",
    controller: "product",
    // Allow all actions except "delete" (permanent delete)
    // Store managers can soft delete (update removedAt) but not hard delete
    allowActions: ["find", "findOne", "create", "update", "search"],
  },
  // Restrict users management - completely disabled for store managers
  { typeKey: "plugin::users-permissions", controller: "user" , allowActions: READ_ACTIONS},

];

function isFullAccessSpec(spec: RolePermissionSpec): spec is FullAccessSpec {
  return spec.mode === "all";
}

function enableAllActions(tree: Record<string, any>) {
  Object.values(tree).forEach((entry: any) => {
    Object.values(entry.controllers || {}).forEach((controller: any) => {
      Object.values(controller).forEach((action: any) => {
        action.enabled = true;
      });
    });
  });
}

function applyControllerActions(
  tree: Record<string, any>,
  strapi: Strapi,
  typeKey: string,
  controllerName: string,
  actions: ReadonlyArray<string> | "*" = [],
) {
  const typeEntry = tree[typeKey];
  if (!typeEntry?.controllers?.[controllerName]) {
    strapi.log.warn(
      `Permission template skipped unknown controller: ${typeKey}.${controllerName}`,
    );
    return;
  }

  const controllerEntry = typeEntry.controllers[controllerName];

  if (actions === "*") {
    Object.keys(controllerEntry).forEach((action) => {
      controllerEntry[action].enabled = true;
    });
    return;
  }

  actions.forEach((actionName) => {
    if (!controllerEntry[actionName]) {
      strapi.log.warn(
        `Permission template skipped unknown action: ${typeKey}.${controllerName}.${actionName}`,
      );
      return;
    }
    controllerEntry[actionName].enabled = true;
  });
}

function applySpecRecursive(
  tree: Record<string, any>,
  strapi: Strapi,
  roleType: string,
  visited = new Set<string>(),
) {
  if (visited.has(roleType)) {
    return;
  }
  visited.add(roleType);

  const spec = ROLE_PERMISSION_SPECS[roleType];
  if (!spec) {
    return;
  }

  if (isFullAccessSpec(spec)) {
    enableAllActions(tree);
    return;
  }

  spec.inherits?.forEach((parent) => {
    applySpecRecursive(tree, strapi, parent, visited);
  });

  Object.entries(spec.grants).forEach(([typeKey, controllers]) => {
    Object.entries(controllers).forEach(([controller, actions]) => {
      applyControllerActions(tree, strapi, typeKey, controller, actions);
    });
  });
}

function getDefaultPermissions(strapi: Strapi, roleType: string): Record<string, any> {
  const usersPermissionsService = strapi.plugin("users-permissions").service("users-permissions");
  const spec = ROLE_PERMISSION_SPECS[roleType];

  if (!spec) {
    return usersPermissionsService.getActions({ defaultEnable: false });
  }

  if (isFullAccessSpec(spec)) {
    const tree = usersPermissionsService.getActions({ defaultEnable: true });
    if (roleType === "store-manager") {
      applyRestrictedControllers(tree, STORE_MANAGER_RESTRICTED_CONTROLLERS, strapi);
    }
    return tree;
  }

  const tree = usersPermissionsService.getActions({ defaultEnable: false });
  applySpecRecursive(tree, strapi, roleType);
  return tree;
}

function applyRestrictedControllers(
  tree: Record<string, any>,
  entries: RestrictedController[],
  strapi: Strapi,
) {
  entries.forEach(({ typeKey, controller, allowActions }) => {
    const controllerEntry = tree[typeKey]?.controllers?.[controller];
    if (!controllerEntry) {
      strapi.log.warn(
        `Permission restriction skipped unknown controller: ${typeKey}.${controller}`,
      );
      return;
    }

    const allowed = new Set(allowActions ?? []);
    Object.entries(controllerEntry).forEach(([actionName, action]: [string, any]) => {
      if (allowed.size > 0 && allowed.has(actionName)) {
        return;
      }
      action.enabled = false;
    });
  });
}

async function assignRolePermissions(strapi: Strapi, role: { id: number; name: string; type?: string | null }) {
  const roleType = role?.type;
  if (!roleType || !ROLE_PERMISSION_SPECS[roleType]) {
    strapi.log.debug(`No permission template configured for role: ${role?.name ?? roleType}`);
    return;
  }

  try {
    const permissions = getDefaultPermissions(strapi, roleType);
    await strapi
      .plugin("users-permissions")
      .service("role")
      .updateRole(role.id, { permissions });
    strapi.log.info(`✓ Assigned permissions for role: ${role.name}`);
  } catch (error) {
    strapi.log.warn(`Could not assign permissions for role: ${role.name}`, {
      error: (error as any)?.message,
    });
  }
}

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
    ensureIranLocations(strapi).catch((err) => {
      strapi.log.error("Failed to ensure province/city seed", err);
    });
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
                  data: {
                    name: r.name,
                    description: r.description,
                    type: r.type,
                  },
                });
              strapi.log.info(`✓ Created users-permissions role: ${r.name}`, { roleId: created.id });

              await assignRolePermissions(strapi, created as any);
            } else {
              strapi.log.info(`✓ Role already exists: ${r.name}`, { roleId: existing.id });
              await assignRolePermissions(strapi, existing as any);
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

      try {
        const publicRole = await strapi
          .query("plugin::users-permissions.role")
          .findOne({ where: { type: "public" } });
        if (publicRole) {
          await assignRolePermissions(strapi, publicRole as any);
        } else {
          strapi.log.warn("Public role not found; permissions were not updated");
        }
      } catch (error) {
        strapi.log.error("Failed to assign permissions for public role", {
          error: (error as any)?.message,
        });
      }
    })();
  },
};
