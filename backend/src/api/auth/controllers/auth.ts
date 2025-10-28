/**
 * A set of functions called "actions" for `auth`
 */

import { RedisClient } from "../../../index";
import jwt from "jsonwebtoken";
import { validatePhone } from "../utils/validations";

const API_ADMIN_ROLE_ID = Number(process.env.API_ADMIN_ROLE_ID || 3);
const API_AUTHENTICATED_ROLE_ID = Number(
  process.env.API_AUTHENTICATED_ROLE_ID || 1
);

async function ensurePluginUser(localUser: any) {
  const roleTitle =
    (localUser?.user_role?.Title ||
      localUser?.user_role?.data?.attributes?.Title ||
      "")?.toString().toLowerCase() || "";
  const isAdmin = roleTitle.includes("admin");

  const pluginUserRepo = strapi.db.query(
    "plugin::users-permissions.user"
  ) as any;

  let pluginUser = await pluginUserRepo.findOne({
    where: { username: localUser.Phone },
    populate: ["role"],
  });

  const targetRoleId = isAdmin ? API_ADMIN_ROLE_ID : API_AUTHENTICATED_ROLE_ID;

  if (!pluginUser) {
    pluginUser = await pluginUserRepo.create({
      data: {
        username: localUser.Phone,
        email: `${localUser.Phone}@infinity.local`,
        password: localUser.Password,
        confirmed: true,
        blocked: false,
        role: targetRoleId,
      },
    });
  } else {
    const updates: Record<string, unknown> = {};
    if (pluginUser.role?.id !== targetRoleId) {
      updates.role = targetRoleId;
    }
    if (!pluginUser.email) {
      updates.email = `${localUser.Phone}@infinity.local`;
    }
    if (Object.keys(updates).length > 0) {
      pluginUser = await pluginUserRepo.update({
        where: { id: pluginUser.id },
        data: updates,
      });
    }
  }

  return pluginUser;
}

function issuePluginToken(pluginUserId: number, localUserId: number) {
  return jwt.sign(
    {
      pluginUserId,
      localUserId,
      userId: localUserId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

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

  const hasUser = await strapi
    .service("api::auth.auth")
    .hasUser(ctx, { phone });

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

    const otpObj = JSON.parse(await (await RedisClient).get(otpToken));

    if (!otpObj?.code) {
      ctx.badRequest("otpToken is invalid");
      return;
    }

    if (String(otpObj.code) !== String(otp)) {
      ctx.badRequest("otp is invalid");
      return;
    }

    if (otpObj.merchant) {
      if (!otpObj.IsVerified) {
        await strapi.entityService.update(
          "api::local-user.local-user",
          otpObj.merchant,
          {
            data: {
              IsVerified: true,
            },
          }
        );
      }
    } else {
      const user = await strapi
        .service("api::local-user.local-user")
        .createUser(ctx, {
          userData: {
            Phone: `+98${otpObj.phone?.substring(1)}`,
            IsVerified: true,
          },
        });

      if (!user) {
        return;
      }

      otpObj.merchant = user.id;
    }

    const token = jwt.sign(
      { userId: otpObj.merchant },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    ctx.body = {
      message: "login successful",
      token,
    };
  } catch (err) {
    strapi.log.error(err);
    ctx.status = 500;
    ctx.body = JSON.stringify(err);
  }
}

async function self(ctx) {
  try {
    // Get user info

    // Get user with role information
    const user = await strapi.db.query("api::local-user.local-user").findOne({
      where: {
        id: ctx.state.user?.id,
      },
      populate: ["user_role", "user_info"],
    });

    // Check if user is an admin (role id is 2)
    const isAdmin = user?.user_role?.id === 2;

    delete user.user_info.id;

    ctx.body = { ...ctx.state.user, ...user.user_info, isAdmin };
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
    const _user = await strapi.db.query("api::local-user.local-user").findOne({
      where: {
        id: user.id,
      },
      populate: ["user_info"],
    });

    if (!_user) {
      ctx.notFound("User info not found");
      return;
    }

    await strapi.db.transaction(async (tx) => {
      await strapi.entityService.update(
        "api::local-user-info.local-user-info",
        _user.user_info.id,
        {
          data: {
            FirstName: firstName,
            LastName: lastName,
          },
        }
      );

      await strapi.entityService.update("api::local-user.local-user", user.id, {
        data: { Password: password },
      });
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
    populate: ["user_role"],
  });

  if (user?.Password !== password) {
    ctx.unauthorized("User not found or password is incorrect");
    return;
  }

  const pluginUser = await ensurePluginUser(user);
  const token = issuePluginToken(pluginUser.id, user.id);

  ctx.body = {
    message: "login successful",
    token,
  };
}

async function resetPassword(ctx) {
  const { otp, otpToken, newPassword } = ctx.request.body;

  if (String(otp || "").length !== 6 || !otpToken?.includes(".")) {
    ctx.badRequest("otp or otpToken is invalid");
    return;
  }

  const otpObj = JSON.parse(await (await RedisClient).get(otpToken));

  if (!otpObj?.code) {
    ctx.badRequest("otpToken is invalid");
    return;
  }

  if (String(otpObj.code) !== String(otp)) {
    ctx.badRequest("otp is invalid");
    return;
  }

  const user = await strapi.entityService.findOne(
    "api::local-user.local-user",
    otpObj.merchant
  );

  if (!user) {
    ctx.unauthorized("Unauthorized");
    return;
  }

  try {
    // update local user info password
    await strapi.entityService.update("api::local-user.local-user", user.id, {
      data: {
        Password: newPassword,
      },
    });

    ctx.body = {
      message: "password reset successfully",
    };
  } catch (err) {
    strapi.log.error(err);
    ctx.status = 500;
    ctx.body = {
      message: err.message,
    };
  }
}
