import { fetchUserWithRole, ROLE_NAMES } from "../../utils/roles";

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
