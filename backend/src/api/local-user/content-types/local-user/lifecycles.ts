type AuditAction = "Create" | "Update" | "Delete";

function getActorFromEvent(event: any): string | undefined {
  try {
    // Strapi lifecycles don't expose ctx directly; we may enrich later via services/controllers if needed
    // For now, fallback to updatedBy/createdBy if present in result
    const createdBy =
      event?.result?.createdBy?.id || event?.params?.data?.updatedBy?.id;
    return createdBy ? String(createdBy) : undefined;
  } catch {
    return undefined;
  }
}

function diffChanges(
  previous: Record<string, any>,
  current: Record<string, any>
) {
  const changes: Record<string, { from: any; to: any }> = {};
  const keys = new Set([
    ...Object.keys(previous || {}),
    ...Object.keys(current || {}),
  ]);
  for (const key of keys) {
    if (
      key === "updatedAt" ||
      key === "createdAt" ||
      key === "id" ||
      key === "documentId" ||
      key === "Password"
    )
      continue;
    const beforeVal = previous?.[key];
    const afterVal = current?.[key];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changes[key] = { from: beforeVal, to: afterVal };
    }
  }
  return changes;
}

export default {
  async afterCreate(event) {
    const { result } = event;
    if (!result?.id) return;

    await strapi.entityService.create("api::local-user-log.local-user-log" as any, {
      data: {
        local_user: result.id,
        Action: "Create" as AuditAction,
        Description: "Local user created",
        PerformedBy: getActorFromEvent(event),
      },
    });
  },

  async beforeUpdate(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const previous = await strapi.entityService.findOne(
      "api::local-user.local-user",
      id,
      {
        fields: [
          "Phone",
          "IsVerified",
          "IsActive",
          // Exclude Password from diffs for security; still loaded but filtered below if needed
        ],
        populate: {
          user_role: true,
        },
      }
    );

    event.state = { ...(event.state || {}), previousLocalUser: previous };
  },

  async afterUpdate(event) {
    const { result, state } = event as any;
    if (!result?.id) return;

    const previous = state?.previousLocalUser || {};
    const current = await strapi.entityService.findOne(
      "api::local-user.local-user",
      result.id,
      {
        fields: ["Phone", "IsVerified", "IsActive"],
        populate: { user_role: true },
      }
    );

    const changes = diffChanges(previous, current);
    if (Object.keys(changes).length === 0) return;

    await strapi.entityService.create("api::local-user-log.local-user-log" as any, {
      data: {
        local_user: result.id,
        Action: "Update" as AuditAction,
        Changes: changes,
        Description: "Local user updated",
        PerformedBy: getActorFromEvent(event),
      },
    });
  },

  async beforeDelete(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    event.state = { ...(event.state || {}), deletingUserId: id };
  },

  async afterDelete(event) {
    const id = (event as any)?.state?.deletingUserId;
    if (!id) return;

    await strapi.entityService.create("api::local-user-log.local-user-log" as any, {
      data: {
        local_user: id,
        Action: "Delete" as AuditAction,
        Description: "Local user deleted",
        PerformedBy: getActorFromEvent(event),
      },
    });
  },
};
