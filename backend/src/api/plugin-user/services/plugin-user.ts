/**
 * plugin-user service
 * Handles plugin user (users-permissions.user) management operations
 */

import bcrypt from "bcryptjs";
import { ROLE_NAMES, fetchRoleByName } from "../../../utils/roles";

export default {
  async createPluginUser(ctx, { userData, userInfoData }) {
    try {
      let pluginUser = null;
      await strapi.db.transaction(async (trx) => {
        try {
          const normalizedPhone = (userData.phone || "").trim();
          if (!normalizedPhone) {
            ctx.badRequest("Phone number is required");
            return null;
          }

          // Normalize phone to +98XXXXXXXXXX format
          const phone = normalizedPhone.startsWith("+98")
            ? normalizedPhone
            : normalizedPhone.startsWith("0")
              ? `+98${normalizedPhone.substring(1)}`
              : `+98${normalizedPhone}`;

          // Check if user already exists
          const existingUser = await strapi
            .query("plugin::users-permissions.user")
            .findOne({ where: { phone } });

          if (existingUser) {
            ctx.conflict("User with this phone number already exists");
            return null;
          }

          // Generate email from phone
          const email = `${phone.replace(/\D/g, "") || "user"}@placeholder.local`;

          // Resolve role - if role is a number, use it directly; otherwise fetch by name
          let roleId = null;
          if (userData.role) {
            if (typeof userData.role === "number") {
              roleId = userData.role;
            } else if (typeof userData.role === "string") {
              const role = await fetchRoleByName(strapi, userData.role as any);
              roleId = role?.id || null;
            }
          }

          // Default to customer role if no role specified
          if (!roleId) {
            const customerRole = await fetchRoleByName(strapi, ROLE_NAMES.CUSTOMER);
            roleId = customerRole?.id || null;
          }

          // Hash password if provided
          let hashedPassword = null;
          if (userData.password) {
            // Check if password is already hashed (starts with $2)
            if (userData.password.startsWith("$2")) {
              hashedPassword = userData.password;
            } else {
              // Hash the password using bcrypt
              hashedPassword = await bcrypt.hash(userData.password, 10);
            }
          }

          // Create plugin user
          pluginUser = await strapi.entityService.create("plugin::users-permissions.user", {
            data: {
              username: phone,
              email,
              phone,
              password: hashedPassword,
              role: roleId,
              confirmed: true,
              blocked: false,
              IsActive: userData.isActive !== false,
            },
          });

          // Create user info
          await strapi.entityService.create("api::local-user-info.local-user-info", {
            data: {
              user: pluginUser.id,
              ...userInfoData,
            },
          });

          // Create local-user-wallet
          await strapi.entityService.create("api::local-user-wallet.local-user-wallet", {
            data: {
              user: pluginUser.id,
              Balance: 0,
            },
          });

          // Create user cart
          await strapi.entityService.create("api::cart.cart", {
            data: {
              user: pluginUser.id,
            },
          });
        } catch (err) {
          strapi.log.error("Failed to create plugin user", err);
          ctx.conflict("Failed to create user");
          return null;
        }
      });

      return pluginUser;
    } catch (err) {
      strapi.log.error("Failed to create plugin user", err);
      ctx.conflict("Failed to create user");
      return null;
    }
  },
};

