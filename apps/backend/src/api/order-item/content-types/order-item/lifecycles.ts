import { asEntityId, touchOrderLastEdited } from "../../../../utils/lastEdited";

export default {
  async afterCreate(event) {
    const { result, params } = event as any;
    await touchOrderLastEdited(result?.order || params?.data?.order);
  },

  async afterUpdate(event) {
    const { result, params } = event as any;
    await touchOrderLastEdited(result?.order || params?.data?.order);
  },

  async beforeDelete(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const existing = await strapi.db.query("api::order-item.order-item").findOne({
      where: { id },
      populate: { order: true },
    });

    event.state = {
      ...(event.state || {}),
      deletingOrderId: asEntityId((existing as any)?.order),
    };
  },

  async afterDelete(event) {
    await touchOrderLastEdited((event as any)?.state?.deletingOrderId);
  },
};
