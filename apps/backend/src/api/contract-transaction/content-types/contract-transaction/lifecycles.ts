import { asEntityId, touchOrderByContract } from "../../../../utils/lastEdited";

export default {
  async afterCreate(event) {
    const { result, params } = event as any;
    await touchOrderByContract(result?.contract || params?.data?.contract);
  },

  async afterUpdate(event) {
    const { result, params } = event as any;
    await touchOrderByContract(result?.contract || params?.data?.contract);
  },

  async beforeDelete(event) {
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const existing = await strapi.db
      .query("api::contract-transaction.contract-transaction")
      .findOne({
        where: { id },
        populate: { contract: true },
      });

    event.state = {
      ...(event.state || {}),
      deletingContractId: asEntityId((existing as any)?.contract),
    };
  },

  async afterDelete(event) {
    await touchOrderByContract((event as any)?.state?.deletingContractId);
  },
};
