/**
 * A set of functions called "actions" for `auth`
 */

import { RedisClient } from "../../../index";
import { validatePhone } from "../utils/validations";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { ROLE_NAMES, fetchRoleByName } from "../../../utils/roles";

export default {
  otp,
  login,
  self,
  updateSelf,
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
    strapi.log.error("Failed to send OTP", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    ctx.status = 500;
    ctx.body = {
      message: "Failed to send OTP. Please try again later.",
      error: "OTP_SEND_FAILED",
    };
  }
}

async function login(ctx) {
  try {
    const { otp, otpToken } = ctx.request.body;

    if (String(otp || "").length !== 6 || !otpToken?.includes(".")) {
      ctx.badRequest("otp or otpToken is invalid");
      return;
    }

    // Safely parse OTP data from Redis with error handling
    let otpObj: any = null;
    try {
      const redisData = await (await RedisClient).get(otpToken);
      if (!redisData) {
        ctx.badRequest("otpToken is invalid or expired");
        return;
      }
      otpObj = JSON.parse(redisData);
    } catch (error) {
      strapi.log.error("Failed to parse OTP token from Redis", {
        otpToken,
        error: (error as Error).message,
      });
      ctx.badRequest("otpToken is invalid");
      return;
    }

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
      const customerRole = await fetchRoleByName(strapi, ROLE_NAMES.CUSTOMER);
      const hashedTempPassword = await bcrypt.hash(
        crypto.randomUUID().replace(/-/g, "").slice(0, 12),
        10,
      );
      upUser = await strapi.entityService.create("plugin::users-permissions.user", {
        data: {
          username: normalizedPhone,
          email,
          phone: normalizedPhone,
          password: hashedTempPassword,
          role: customerRole?.id,
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
    strapi.log.error("Login failed", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    ctx.status = 500;
    ctx.body = {
      message: "Login failed. Please try again later.",
      error: "LOGIN_FAILED",
    };
  }
}

async function self(ctx) {
  try {
    let pluginUserId = await resolvePluginUserId(ctx);
    if (!pluginUserId) {
      return ctx.unauthorized("Unauthorized");
    }

    const fullUser = await strapi.entityService.findOne("plugin::users-permissions.user", Number(pluginUserId), {
      populate: ["role"],
    });

    if (!fullUser) {
      return ctx.unauthorized("Unauthorized");
    }

    // Determine administrative flag based on plugin role name
    const roleName = fullUser?.role?.name;
    const isAdmin = roleName === "Superadmin" || roleName === "Store manager";

    // Load profile from local-user-info which now points to plugin user
    const localUserInfo = await strapi.db
      .query("api::local-user-info.local-user-info")
      .findOne({ where: { user: pluginUserId } });
    const profile = localUserInfo ? { ...localUserInfo } : {};
    if (profile && (profile as any).id) delete (profile as any).id;

    const phone =
      typeof fullUser?.phone === "string" && fullUser.phone.trim().length > 0
        ? fullUser.phone.trim()
        : undefined;

    ctx.body = {
      ...ctx.state.user,
      ...profile,
      Phone: phone || profile?.Phone || null,
      phone: phone || profile?.phone || null,
      UserName: fullUser?.username ?? profile?.UserName,
      Email: fullUser?.email ?? profile?.Email,
      isAdmin,
      roleName: roleName ?? null,
    };
  } catch (err) {
    strapi.log.error(err);
    ctx.status = 500;
    ctx.body = {
      message: err.message,
    };
  }
}

async function updateSelf(ctx) {
  try {
    const pluginUserId = await resolvePluginUserId(ctx);
    if (!pluginUserId) {
      return ctx.unauthorized("Unauthorized");
    }

    const body = ctx.request.body ?? {};
    const profilePayload: Record<string, any> = {};
    const hasOwn = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

    if (hasOwn(body, "FirstName")) {
      profilePayload.FirstName =
        typeof body.FirstName === "string" && body.FirstName.trim().length > 0
          ? body.FirstName.trim()
          : null;
    }
    if (hasOwn(body, "LastName")) {
      profilePayload.LastName =
        typeof body.LastName === "string" && body.LastName.trim().length > 0
          ? body.LastName.trim()
          : null;
    }
    if (hasOwn(body, "NationalCode")) {
      profilePayload.NationalCode =
        typeof body.NationalCode === "string" && body.NationalCode.trim().length > 0
          ? body.NationalCode.trim()
          : null;
    }
    if (hasOwn(body, "BirthDate")) {
      const normalizedBirthDate =
        typeof body.BirthDate === "string" && body.BirthDate.trim().length > 0
          ? body.BirthDate.trim()
          : null;
      profilePayload.BirthDate = normalizedBirthDate;
    }
    if (hasOwn(body, "Sex")) {
      const rawSex = body.Sex;
      if (rawSex === null || rawSex === undefined || rawSex === "") {
        profilePayload.Sex = null;
      } else if (typeof rawSex === "boolean") {
        profilePayload.Sex = rawSex;
      } else if (typeof rawSex === "string") {
        profilePayload.Sex = rawSex === "true" || rawSex === "1";
      } else {
        profilePayload.Sex = Boolean(rawSex);
      }
    }
    if (hasOwn(body, "Bio")) {
      profilePayload.Bio =
        typeof body.Bio === "string" && body.Bio.trim().length > 0 ? body.Bio.trim() : null;
    }

    let profileRecord = await strapi.db
      .query("api::local-user-info.local-user-info")
      .findOne({ where: { user: pluginUserId } });

    if (!profileRecord) {
      if (Object.keys(profilePayload).length > 0) {
        profileRecord = await strapi.entityService.create("api::local-user-info.local-user-info", {
          data: {
            user: pluginUserId,
            ...profilePayload,
          },
        });
      }
    } else if (Object.keys(profilePayload).length > 0) {
      await strapi.entityService.update("api::local-user-info.local-user-info", profileRecord.id, {
        data: profilePayload,
      });
    }

    if (hasOwn(body, "Phone")) {
      let normalizedPhone = String(body.Phone ?? "").trim();
      if (normalizedPhone.length > 0) {
        if (normalizedPhone.startsWith("0")) {
          normalizedPhone = `+98${normalizedPhone.substring(1)}`;
        }
        if (!normalizedPhone.startsWith("+")) {
          normalizedPhone = `+${normalizedPhone}`;
        }
        await strapi.entityService.update("plugin::users-permissions.user", pluginUserId, {
          data: {
            phone: normalizedPhone,
            username: normalizedPhone,
            email: `${normalizedPhone.replace(/\D/g, "") || "user"}@placeholder.local`,
          },
        });
      }
    }

    await self(ctx);
  } catch (err) {
    strapi.log.error(err);
    ctx.status = 500;
    ctx.body = {
      message: err.message,
    };
  }
}

async function registerInfo(ctx) {
  const { firstName, lastName, password, phone, birthDate } = ctx.request.body;
  let user = ctx.state.user;
  const normalizedBirthDate =
    typeof birthDate === "string" && birthDate.trim().length > 0
      ? birthDate.trim()
      : null;

  try {
    if (!user?.id) {
      const authHeader = ctx.request.header.authorization || "";
      const token = authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.split(" ")[1]
        : null;
      if (token) {
        try {
      const payload = await strapi
        .plugin("users-permissions")
        .service("jwt")
        .verify(token);
          if (payload?.id) {
            user = await strapi.entityService.findOne("plugin::users-permissions.user", payload.id);
          }
        } catch (err) {
          strapi.log.debug("Failed to verify JWT for registerInfo", err);
        }
      }
    }

    if (!user?.id) {
      return ctx.unauthorized("Unauthorized");
    }

    const pluginUserId = Number(user.id);
    // Find profile record that points to plugin user
    let profileRecord = await strapi.db
      .query("api::local-user-info.local-user-info")
      .findOne({ where: { user: pluginUserId } });

    await strapi.db.transaction(async () => {
      if (!profileRecord) {
        profileRecord = await strapi.entityService.create("api::local-user-info.local-user-info", {
          data: {
            user: pluginUserId,
            FirstName: firstName,
            LastName: lastName,
            BirthDate: normalizedBirthDate,
          },
        });
      } else {
        await strapi.entityService.update("api::local-user-info.local-user-info", profileRecord.id, {
          data: {
            FirstName: firstName,
            LastName: lastName,
            BirthDate: normalizedBirthDate ?? profileRecord?.BirthDate ?? null,
          },
        });
      }

      // update plugin user's password
      if (password) {
        const hashed = await bcrypt.hash(password, 10);
        await strapi.entityService.update("plugin::users-permissions.user", pluginUserId, {
          data: { password: hashed },
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

    if (phone) {
      let normalizedPhone = String(phone).trim();
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = `+98${normalizedPhone.substring(1)}`;
      }
      if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = `+${normalizedPhone}`;
      }

      await strapi.entityService.update("plugin::users-permissions.user", pluginUserId, {
        data: {
          phone: normalizedPhone,
          username: normalizedPhone,
          email: `${normalizedPhone.replace(/\D/g, "") || "user"}@placeholder.local`,
        },
      });
    }

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

  if (!phone || !password) {
    ctx.badRequest("Phone and password are required");
    return;
  }

  const sanitizedPhone = String(phone).trim();
  const lookupFragment =
    sanitizedPhone.startsWith("+") || sanitizedPhone.startsWith("0")
      ? sanitizedPhone.slice(1)
      : sanitizedPhone;

  const upUser = await strapi
    .query("plugin::users-permissions.user")
    .findOne({ where: { phone: { $eq: sanitizedPhone } } });
  if (!upUser) {
    const userBySuffix = await strapi
      .query("plugin::users-permissions.user")
      .findOne({ where: { phone: { $endsWith: lookupFragment } } });
    if (userBySuffix) {
      await strapi.entityService.update("plugin::users-permissions.user", userBySuffix.id, {
        data: { phone: sanitizedPhone },
      });
    }
  }
  const finalUser = await strapi
    .query("plugin::users-permissions.user")
    .findOne({ where: { phone: sanitizedPhone }, select: ["id", "password"] });

  if (!finalUser) {
    ctx.unauthorized("User not found or password is incorrect");
    return;
  }

  if (!finalUser.password) {
    strapi.log.error("User loaded without password hash", { id: finalUser.id });
  }

  const userService = strapi.plugin("users-permissions").service("user");
  const isPasswordValid = await userService.validatePassword(password, finalUser.password);

  if (!isPasswordValid) {
    ctx.unauthorized("User not found or password is incorrect");
    return;
  }

  const token = await strapi.plugin("users-permissions").service("jwt").issue({ id: finalUser.id });

  ctx.body = { message: "login successful", token };
}

async function resetPassword(ctx) {
  const { otp, otpToken, newPassword } = ctx.request.body;

  if (String(otp || "").length !== 6 || !otpToken?.includes(".")) {
    ctx.badRequest("otp or otpToken is invalid");
    return;
  }

  // Safely parse OTP data from Redis with error handling
  let otpObj: any = null;
  try {
    const redisData = await (await RedisClient).get(otpToken);
    if (!redisData) {
      ctx.badRequest("otpToken is invalid or expired");
      return;
    }
    otpObj = JSON.parse(redisData);
  } catch (error) {
    strapi.log.error("Failed to parse OTP token from Redis (resetPassword)", {
      otpToken,
      error: (error as Error).message,
    });
    ctx.badRequest("otpToken is invalid");
    return;
  }

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
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await strapi.entityService.update("plugin::users-permissions.user", pluginUser.id, {
      data: {
        password: hashedPassword,
      },
    });

    ctx.body = { message: "password reset successfully" };
  } catch (err) {
    strapi.log.error(err);
    ctx.status = 500;
    ctx.body = { message: err.message };
  }
}

async function resolvePluginUserId(ctx) {
  let pluginUserId = ctx.state.user?.id;

  if (!pluginUserId) {
    const authHeader = ctx.request.header.authorization || "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.split(" ")[1]
      : null;
    if (token) {
      try {
        const payload = await strapi
          .plugin("users-permissions")
          .service("jwt")
          .verify(token);
        pluginUserId = payload?.id ? Number(payload.id) : undefined;
      } catch (err) {
        strapi.log.debug("Failed to verify JWT for resolvePluginUserId", err);
      }
    }
  }

  return pluginUserId ? Number(pluginUserId) : undefined;
}
