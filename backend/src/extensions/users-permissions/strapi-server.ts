import { fetchUserWithRole, ROLE_NAMES } from "../../utils/roles";

function looksLikeBcryptHash(value?: string): value is string {
  return typeof value === "string" && value.startsWith("$2");
}

async function ensurePasswordIsHashed(ctx: any) {
  const password = ctx.request?.body?.password;
  if (looksLikeBcryptHash(password)) {
    return;
  }

  if (!password) {
    return;
  }

  const userService = strapi.plugin("users-permissions").service("user");
  if (typeof userService.hashPassword !== "function") {
    return;
  }

  ctx.request.body.password = await userService.hashPassword(password);
}

function wantsPluginRoleChange(ctx: any) {
  const body = ctx.request?.body || {};
  return Object.prototype.hasOwnProperty.call(body, "role") && body.role !== undefined;
}

async function assertSuperadmin(ctx: any) {
  const actorId = ctx.state?.user?.id;
  if (!actorId) {
    ctx.unauthorized("Authentication required");
    return false;
  }

  const actor = await fetchUserWithRole(strapi, Number(actorId));
  const actorRoleName = actor?.role?.name || null;

  if (actorRoleName !== ROLE_NAMES.SUPERADMIN) {
    ctx.forbidden("Only Superadmins can change user roles");
    return false;
  }

  return true;
}

const wrapUserController =
  (controllerFn: (ctx: any, next?: any) => Promise<unknown>) =>
  async (ctx: any, next?: any) => {
    await ensurePasswordIsHashed(ctx);

    if (wantsPluginRoleChange(ctx)) {
      const allowed = await assertSuperadmin(ctx);
      if (!allowed) {
        return;
      }
    }

    return controllerFn(ctx, next);
  };

export default (plugin: any) => {
  plugin.controllers.user.update = wrapUserController(plugin.controllers.user.update);
  plugin.controllers.user.create = wrapUserController(plugin.controllers.user.create);

  return plugin;
};
