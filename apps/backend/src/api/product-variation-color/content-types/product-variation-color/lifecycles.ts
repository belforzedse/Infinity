import { resolveAuditActor } from "../../../../utils/audit";
import { logManualActivity } from "../../../../utils/manualAdminActivity";

export default {
  async afterCreate(event) {
    const { result } = event;
    const actor = resolveAuditActor(event as any);
    if (!result?.id || !actor.userId) return;

    await logManualActivity(strapi, {
      resourceType: "Product",
      resourceId: result.product || undefined,
      action: "Create",
      title: "رنگ جدید اضافه شد",
      message: `رنگ ${result.Name} برای محصول اضافه شد`,
      messageEn: `Color ${result.Name} added`,
      severity: "success",
      metadata: { colorId: result.id },
      performedBy: { id: actor.userId },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },

  async afterUpdate(event) {
    const { result } = event as any;
    const actor = resolveAuditActor(event as any);
    if (!result?.id || !actor.userId) return;

    await logManualActivity(strapi, {
      resourceType: "Product",
      resourceId: result.product || undefined,
      action: "Update",
      title: "رنگ ویرایش شد",
      message: `رنگ ${result.Name} بروزرسانی شد`,
      messageEn: `Color ${result.Name} updated`,
      severity: "info",
      metadata: { colorId: result.id },
      performedBy: { id: actor.userId },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },

  async afterDelete(event) {
    const id = (event as any)?.params?.where?.id;
    const actor = resolveAuditActor(event as any);
    if (!id || !actor.userId) return;

    await logManualActivity(strapi, {
      resourceType: "Product",
      resourceId: null,
      action: "Delete",
      title: "رنگ حذف شد",
      message: `رنگ ${id} حذف شد`,
      messageEn: `Color ${id} deleted`,
      severity: "warning",
      metadata: { colorId: id },
      performedBy: { id: actor.userId },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });
  },
};

