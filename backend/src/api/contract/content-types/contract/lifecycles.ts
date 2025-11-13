import { resolveAuditActor } from "../../../../utils/audit";

type AuditAction = "Create" | "Update" | "Delete";

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
      key === "documentId"
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
    const actor = resolveAuditActor(event as any);

    await strapi.entityService.create("api::contract-log.contract-log" as any, {
      data: {
        contract: result.id,
        performed_by: actor.userId,
        PerformedBy: actor.label || undefined,
        IP: actor.ip || undefined,
        UserAgent: actor.userAgent || undefined,
        Action: "Create" as AuditAction,
        Description: "Contract created",
      },
    });
  },

  async beforeUpdate(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const previous = await strapi.entityService.findOne(
      "api::contract.contract",
      id,
      {
        fields: ["Type", "Status", "Amount", "TaxPercent", "Date"],
        populate: { local_user: true, order: true },
      }
    );

    event.state = { ...(event.state || {}), previousContract: previous };
  },

  async afterUpdate(event) {
    const { result, state } = event as any;
    if (!result?.id) return;
    const actor = resolveAuditActor(event as any);

    const previous = state?.previousContract || {};
    const current = await strapi.entityService.findOne(
      "api::contract.contract",
      result.id,
      {
        fields: ["Type", "Status", "Amount", "TaxPercent", "Date"],
        populate: { local_user: true, order: true },
      }
    );

    const changes = diffChanges(previous, current);
    if (Object.keys(changes).length === 0) return;

    await strapi.entityService.create("api::contract-log.contract-log" as any, {
      data: {
        contract: result.id,
        performed_by: actor.userId,
        PerformedBy: actor.label || undefined,
        IP: actor.ip || undefined,
        UserAgent: actor.userAgent || undefined,
        Action: "Update" as AuditAction,
        Changes: changes,
        Description: "Contract updated",
      },
    });
  },

  async beforeDelete(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;
    event.state = { ...(event.state || {}), deletingContractId: id };
  },

  async afterDelete(event) {
    const id = (event as any)?.state?.deletingContractId;
    if (!id) return;
    const actor = resolveAuditActor(event as any);

    await strapi.entityService.create("api::contract-log.contract-log" as any, {
      data: {
        contract: id,
        performed_by: actor.userId,
        PerformedBy: actor.label || undefined,
        IP: actor.ip || undefined,
        UserAgent: actor.userAgent || undefined,
        Action: "Delete" as AuditAction,
        Description: "Contract deleted",
      },
    });
  },
};
