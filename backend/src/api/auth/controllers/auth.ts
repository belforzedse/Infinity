/**
 * A set of functions called "actions" for `auth`
 */

import { RedisClient } from "../../../index";
import { validatePhone } from "../utils/validations";

export default {
  otp,
  login,
  self,
  welcome,
  registerInfo,
  loginWithPassword,
  resetPassword,
};

async function welcome(ctx) {
  const { phone } = ctx.request.body;

  const validation = validatePhone(ctx, phone);

  if (validation !== 200) {
    return validation;
  }

  const hasUser = await strapi.service("api::auth.auth").hasUser(ctx, { phone });

  ctx.body = {
    message: "welcome",
    hasUser,
  };
}

async function otp(ctx) {
  try {
    const { phone } = ctx.request.body;

    const validation = validatePhone(ctx, phone);

    if (validation !== 200) {
      return validation;
    }

    const otpToken = await strapi.service("api::auth.auth").otp(ctx, { phone });

    ctx.body = {
      message: "otp sent",
      otpToken,
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = err;
  }
}

async function login(ctx) {
  try {
    const { otp, otpToken } = ctx.request.body;

    if (String(otp || "").length !== 6 || !otpToken?.includes(".")) {
      ctx.badRequest("otp or otpToken is invalid");
      return;
    }

    const otpObj = JSON.parse(await(await RedisClient).get(otpToken));

    if (!otpObj?.code) {
      ctx.badRequest("otpToken is invalid");
      return;
    }

    if (String(otpObj.code) !== String(otp)) {
      ctx.badRequest("otp is invalid");
      return;
    }

    // Ensure a plugin user exists for this phone and issue plugin JWT
    let upUser = await strapi
      .query("plugin::users-permissions.user")
      .findOne({ where: { phone: { $endsWith: otpObj.phone.substring(1) } } });
    const normalizedPhone = (otpObj.phone || "").trim();
    if (upUser) {
      // if not confirmed, mark as confirmed
      if (!upUser.confirmed) {
        await strapi.entityService.update("plugin::users-permissions.user", upUser.id, {
          data: { confirmed: true },
        });
      }
    } else {
      const email = `${normalizedPhone.replace(/\D/g, "") || "user"}@placeholder.local`;
      upUser = await strapi.entityService.create("plugin::users-permissions.user", {
        data: {
          username: normalizedPhone,
          email,
          phone: normalizedPhone,
          confirmed: true,
          blocked: false,
          IsActive: true,
        },
      });

      // create user_info record (was local-user-info) and link to plugin user
      try {
        await strapi.entityService.create("api::local-user-info.local-user-info", {
          data: { user: upUser.id },
        });
      } catch (e) {
        strapi.log.warn("Failed to create user_info for new plugin user", e);
      }
    }

    const token = await strapi.plugin("users-permissions").service("jwt").issue({ id: upUser.id });

    ctx.body = { message: "login successful", token };
  } catch (err) {
    strapi.log.error(err);
    ctx.status = 500;
    ctx.body = JSON.stringify(err);
  }
}

async function self(ctx) {
  try {
    // Get user info

    // ctx.state.user is a plugin user. Load full plugin user (with role) and optionally legacy profile
    const pluginUserId = ctx.state.user?.id;
    const fullUser = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { id: pluginUserId }, populate: ["role"] });

    // Determine administrative flag based on plugin role name
    const roleName = fullUser?.role?.name;
    const isAdmin = roleName === "Superadmin" || roleName === "Store manager";

    // Load profile from local-user-info which now points to plugin user
    const localUserInfo = await strapi.db
      .query("api::local-user-info.local-user-info")
      .findOne({ where: { user: pluginUserId } });
    const profile = localUserInfo ? { ...localUserInfo } : {};
    if (profile && (profile as any).id) delete (profile as any).id;

    ctx.body = { ...ctx.state.user, ...profile, isAdmin };
  } catch (err) {
    strapi.log.error(err);
    ctx.status = 500;
    ctx.body = {
      message: err.message,
    };
  }
}

async function registerInfo(ctx) {
  const { firstName, lastName, password } = ctx.request.body;
  const user = ctx.state.user;

  try {
    const pluginUserId = user.id;
    // Find profile record that points to plugin user
    const profileRecord = await strapi.db
      .query("api::local-user-info.local-user-info")
      .findOne({ where: { user: pluginUserId } });

    if (!profileRecord) {
      ctx.notFound("User info not found");
      return;
    }

    await strapi.db.transaction(async () => {
      await strapi.entityService.update("api::local-user-info.local-user-info", profileRecord.id, {
        data: {
          FirstName: firstName,
          LastName: lastName,
        },
      });

      // update plugin user's password
      if (password) {
        await strapi.entityService.update("plugin::users-permissions.user", pluginUserId, {
          data: { password },
        });
      }

      // If there is an existing legacy local-user linked, update its Password as well for compatibility
      const legacyLocal = await strapi.db
        .query("api::local-user.local-user")
        .findOne({ where: { strapi_user: pluginUserId } });
      if (legacyLocal) {
        await strapi.entityService.update("api::local-user.local-user", legacyLocal.id, {
          data: { Password: password },
        });
      }
    });

    ctx.body = {
      message: "info updated",
    };
    return ctx;
  } catch (err) {
    strapi.log.error(err);
    ctx.status = 500;
    ctx.body = {
      message: err.message,
    };
  }
}

async function loginWithPassword(ctx) {
  const { phone, password } = ctx.request.body;

  const user = await strapi.db.query("api::local-user.local-user").findOne({
    where: { Phone: { $endsWith: phone.substring(1) } },
  });

  if (user?.Password !== password) {
    ctx.unauthorized("User not found or password is incorrect");
    return;
  }

  // Ensure plugin user exists and issue JWT
  const normalizedPhone = (user?.Phone || "").trim();
  let upUser = await strapi
    .query("plugin::users-permissions.user")
    .findOne({ where: { phone: normalizedPhone } });
  if (!upUser) {
    const email = `${normalizedPhone.replace(/\D/g, "") || "user"}@placeholder.local`;
    const created = await strapi.entityService.create("plugin::users-permissions.user", {
      data: {
        username: normalizedPhone,
        email,
        phone: normalizedPhone,
        confirmed: true,
        blocked: false,
        IsActive: true,
      },
    });
    upUser = created as any;
    await strapi.entityService.update("api::local-user.local-user", user.id, {
      data: { strapi_user: upUser.id } as any,
    } as any);
  }

  const token = await strapi.plugin("users-permissions").service("jwt").issue({ id: upUser.id });

  ctx.body = { message: "login successful", token };
}

async function resetPassword(ctx) {
  const { otp, otpToken, newPassword } = ctx.request.body;

  if (String(otp || "").length !== 6 || !otpToken?.includes(".")) {
    ctx.badRequest("otp or otpToken is invalid");
    return;
  }

  const otpObj = JSON.parse(await(await RedisClient).get(otpToken));

  if (!otpObj?.code) {
    ctx.badRequest("otpToken is invalid");
    return;
  }

  if (String(otpObj.code) !== String(otp)) {
    ctx.badRequest("otp is invalid");
    return;
  }

  // otpObj.merchant should be plugin user id now
  const pluginUser = await strapi.entityService.findOne(
    "plugin::users-permissions.user",
    otpObj.merchant,
  );
  if (!pluginUser) {
    ctx.unauthorized("Unauthorized");
    return;
  }

  try {
    await strapi.entityService.update("plugin::users-permissions.user", pluginUser.id, {
      data: {
        password: newPassword,
      },
    });

    ctx.body = { message: "password reset successfully" };
  } catch (err) {
    strapi.log.error(err);
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
}
