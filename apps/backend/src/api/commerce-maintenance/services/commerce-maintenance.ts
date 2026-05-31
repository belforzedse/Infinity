import type { Strapi } from "@strapi/strapi";
import { logManualActivity } from "../../../utils/manualAdminActivity";

export const COMMERCE_PURGE_CONFIRMATION = "DELETE_COMMERCE_DATA";

type EntityTarget = {
  uid: string;
  label: string;
};

export const COMMERCE_DELETE_TARGETS: readonly EntityTarget[] = [
  { uid: "api::discount.discount", label: "Discounts" },
  { uid: "api::general-discount.general-discount", label: "General discounts" },
  { uid: "api::cart-item.cart-item", label: "Cart items" },
  { uid: "api::cart.cart", label: "Carts" },
  { uid: "api::contract-log.contract-log", label: "Contract logs" },
  { uid: "api::contract-transaction.contract-transaction", label: "Contract transactions" },
  { uid: "api::order-log.order-log", label: "Order logs" },
  { uid: "api::order-item.order-item", label: "Order items" },
  { uid: "api::order.order", label: "Orders" },
  { uid: "api::contract.contract", label: "Contracts" },
  { uid: "api::product-review-like.product-review-like", label: "Product review likes" },
  { uid: "api::product-review-reply.product-review-reply", label: "Product review replies" },
  { uid: "api::product-review.product-review", label: "Product reviews" },
  { uid: "api::product-like.product-like", label: "Product likes" },
  { uid: "api::product-view.product-view", label: "Product views" },
  { uid: "api::product-log.product-log", label: "Product logs" },
  { uid: "api::product-faq.product-faq", label: "Product FAQs" },
  { uid: "api::product-size-helper.product-size-helper", label: "Product size helpers" },
  { uid: "api::product-variation-log.product-variation-log", label: "Product variation logs" },
  { uid: "api::product-stock-log.product-stock-log", label: "Product stock logs" },
  { uid: "api::product-stock.product-stock", label: "Product stock" },
  { uid: "api::product-variation.product-variation", label: "Product variations" },
  { uid: "api::product-variation-color.product-variation-color", label: "Product variation colors" },
  { uid: "api::product-variation-size.product-variation-size", label: "Product variation sizes" },
  { uid: "api::product-variation-model.product-variation-model", label: "Product variation models" },
  { uid: "api::product.product", label: "Products" },
  { uid: "api::product-category-content.product-category-content", label: "Product category content" },
  { uid: "api::product-category.product-category", label: "Product categories" },
  { uid: "api::product-tag.product-tag", label: "Product tags" },
] as const;

export const COMMERCE_KEEP_TARGETS = [
  "plugin::users-permissions.user",
  "plugin::users-permissions.role",
  "plugin::users-permissions.permission",
  "api::local-user.local-user",
  "api::local-user-info.local-user-info",
  "api::local-user-address.local-user-address",
  "api::local-user-role.local-user-role",
  "api::local-user-permission.local-user-permission",
  "api::local-user-wallet.local-user-wallet",
  "api::post.post",
  "api::post-like.post-like",
  "api::post-bookmark.post-bookmark",
  "api::post-comment.post-comment",
  "api::post-comment-like.post-comment-like",
  "api::story.story",
  "api::story-seen.story-seen",
  "api::notification.notification",
  "api::payment-gateway.payment-gateway",
  "api::shipping.shipping",
  "api::shipping-city.shipping-city",
  "api::shipping-province.shipping-province",
  "api::settings.settings",
  "api::navigation.navigation",
  "api::footer.footer",
  "plugin::upload.file",
  "plugin::upload.folder",
] as const;

export const COMMERCE_NEEDS_CONFIRMATION_TARGETS = [
  "api::admin-activity.admin-activity",
  "api::manual-admin-activity.manual-admin-activity",
  "api::event-log.event-log",
  "api::user-activity.user-activity",
  "api::wallet-topup.wallet-topup",
  "api::local-user-wallet-transaction.local-user-wallet-transaction",
] as const;

const MEDIA_RELATION_TABLES = ["files_related_morphs", "upload_file_morph"] as const;
const MEDIA_FILE_ID_COLUMNS = ["file_id", "upload_file_id"] as const;
const PRODUCT_MEDIA_DELETE_UIDS = [
  "api::product.product",
  "api::product-category-content.product-category-content",
  "api::product-category.product-category",
  "api::product-tag.product-tag",
  "api::product-faq.product-faq",
  "api::product-size-helper.product-size-helper",
  "api::product-variation.product-variation",
  "api::product-variation-color.product-variation-color",
  "api::product-variation-size.product-variation-size",
  "api::product-variation-model.product-variation-model",
] as const;

type PurgeOptions = {
  dryRun: boolean;
  confirmation?: string;
  performedBy?: {
    id?: number;
    role?: string | null;
  };
  ip?: string | null;
  userAgent?: string | null;
};

type MediaRelationSummary = {
  relationRowsDeleted: number;
  physicalFilesDeleted: number;
};

type PurgeSummary = {
  dryRun: boolean;
  confirmationRequired: string;
  summary: Record<string, number>;
  labels: Record<string, string>;
  mediaRelations: MediaRelationSummary;
  kept: readonly string[];
  needsConfirmation: readonly string[];
};

const deleteUids = COMMERCE_DELETE_TARGETS.map((target) => target.uid);
const labels = COMMERCE_DELETE_TARGETS.reduce<Record<string, string>>((acc, target) => {
  acc[target.uid] = target.label;
  return acc;
}, {});

const parseCount = (raw: unknown): number => {
  if (Array.isArray(raw)) {
    const first = raw[0] as Record<string, unknown> | undefined;
    return parseCount(first?.count ?? first?.["count(*)"]);
  }

  if (typeof raw === "object" && raw !== null) {
    const value = (raw as Record<string, unknown>).count;
    return parseCount(value);
  }

  const numeric = Number(raw || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const hasTable = async (knexOrTrx: any, tableName: string): Promise<boolean> => {
  try {
    return await knexOrTrx.schema.hasTable(tableName);
  } catch {
    return false;
  }
};

const getMediaFileIdColumn = async (
  knexOrTrx: any,
  tableName: string,
): Promise<(typeof MEDIA_FILE_ID_COLUMNS)[number] | null> => {
  if (typeof knexOrTrx.schema?.hasColumn !== "function") {
    return tableName === "upload_file_morph" ? "upload_file_id" : "file_id";
  }

  for (const columnName of MEDIA_FILE_ID_COLUMNS) {
    try {
      if (await knexOrTrx.schema.hasColumn(tableName, columnName)) {
        return columnName;
      }
    } catch {
      return tableName === "upload_file_morph" ? "upload_file_id" : "file_id";
    }
  }

  return null;
};

const uniqueNumericIds = (ids: Iterable<unknown>): number[] => {
  const uniqueIds = new Set<number>();

  for (const id of ids) {
    const numericId = Number(id);
    if (Number.isInteger(numericId) && numericId > 0) {
      uniqueIds.add(numericId);
    }
  }

  return [...uniqueIds];
};

const countMediaRelations = async (strapi: Strapi): Promise<number> => {
  let total = 0;
  const knex = strapi.db.connection;

  for (const tableName of MEDIA_RELATION_TABLES) {
    if (!(await hasTable(knex, tableName))) continue;

    const rows = await knex(tableName)
      .whereIn("related_type", deleteUids)
      .count({ count: "*" });
    total += parseCount(rows);
  }

  return total;
};

const collectCommerceMediaFileIds = async (
  strapi: Strapi,
  knexOrTrx: any = strapi.db.connection,
): Promise<number[]> => {
  const mediaFileIds: unknown[] = [];

  for (const tableName of MEDIA_RELATION_TABLES) {
    if (!(await hasTable(knexOrTrx, tableName))) continue;

    const fileIdColumn = await getMediaFileIdColumn(knexOrTrx, tableName);
    if (!fileIdColumn) continue;

    const rows = await knexOrTrx(tableName)
      .whereIn("related_type", PRODUCT_MEDIA_DELETE_UIDS)
      .select(fileIdColumn);

    for (const row of rows || []) {
      mediaFileIds.push((row as Record<string, unknown>)[fileIdColumn]);
    }
  }

  return uniqueNumericIds(mediaFileIds);
};

const collectReferencedMediaFileIds = async (
  strapi: Strapi,
  mediaFileIds: number[],
  options?: { excludeCommerceRelations?: boolean },
): Promise<number[]> => {
  if (!mediaFileIds.length) return [];

  const referencedFileIds: unknown[] = [];
  const knex = strapi.db.connection;

  for (const tableName of MEDIA_RELATION_TABLES) {
    if (!(await hasTable(knex, tableName))) continue;

    const fileIdColumn = await getMediaFileIdColumn(knex, tableName);
    if (!fileIdColumn) continue;

    let query = knex(tableName).whereIn(fileIdColumn, mediaFileIds);
    if (options?.excludeCommerceRelations) {
      query = query.whereNotIn("related_type", deleteUids);
    }

    const rows = await query.select(fileIdColumn);

    for (const row of rows || []) {
      referencedFileIds.push((row as Record<string, unknown>)[fileIdColumn]);
    }
  }

  return uniqueNumericIds(referencedFileIds);
};

const getOrphanedMediaFileIds = async (
  strapi: Strapi,
  mediaFileIds: number[],
  options?: { excludeCommerceRelations?: boolean },
): Promise<number[]> => {
  const referencedFileIds = new Set(
    await collectReferencedMediaFileIds(strapi, mediaFileIds, options),
  );

  return mediaFileIds.filter((fileId) => !referencedFileIds.has(fileId));
};

const deleteMediaRelations = async (strapi: Strapi, trx: any): Promise<number> => {
  let total = 0;
  const knex = trx || strapi.db.connection;

  for (const tableName of MEDIA_RELATION_TABLES) {
    if (!(await hasTable(knex, tableName))) continue;

    const deleted = await knex(tableName)
      .whereIn("related_type", deleteUids)
      .del();
    total += Number(deleted || 0);
  }

  return total;
};

const deleteUploadFiles = async (strapi: Strapi, mediaFileIds: number[]): Promise<number> => {
  if (!mediaFileIds.length) return 0;

  const uploadService = strapi.plugin("upload").service("upload");
  let deletedCount = 0;

  for (const fileId of mediaFileIds) {
    try {
      const file = await uploadService.findOne(fileId);
      if (!file) continue;

      await uploadService.remove(file);
      deletedCount += 1;
    } catch (error) {
      strapi.log.error("Commerce purge failed to delete upload media file", {
        fileId,
        error,
      });
    }
  }

  return deletedCount;
};

const countTargets = async (strapi: Strapi): Promise<Record<string, number>> => {
  const summary: Record<string, number> = {};

  for (const target of COMMERCE_DELETE_TARGETS) {
    summary[target.uid] = await strapi.db.query(target.uid as any).count();
  }

  return summary;
};

const deleteTargets = async (
  strapi: Strapi,
  trx: any,
): Promise<Record<string, number>> => {
  const summary: Record<string, number> = {};

  for (const target of COMMERCE_DELETE_TARGETS) {
    const result = await strapi.db.query(target.uid as any).deleteMany({
      where: {},
      transacting: trx,
    } as any);
    summary[target.uid] = Number(result?.count || 0);
  }

  return summary;
};

export default ({ strapi }: { strapi: Strapi }) => ({
  async purgeCommerceData(options: PurgeOptions): Promise<PurgeSummary> {
    const dryRun = options.dryRun !== false;

    if (!dryRun && options.confirmation !== COMMERCE_PURGE_CONFIRMATION) {
      throw Object.assign(new Error("Invalid confirmation string"), {
        code: "INVALID_CONFIRMATION",
        status: 400,
      });
    }

    if (dryRun) {
      const summary = await countTargets(strapi);
      const relationRows = await countMediaRelations(strapi);
      const mediaFileIds = await collectCommerceMediaFileIds(strapi);
      const orphanedMediaFileIds = await getOrphanedMediaFileIds(strapi, mediaFileIds, {
        excludeCommerceRelations: true,
      });

      strapi.log.info("Commerce purge dry-run completed", {
        summary,
        mediaRelationRows: relationRows,
        physicalFilesToDelete: orphanedMediaFileIds.length,
      });

      return {
        dryRun: true,
        confirmationRequired: COMMERCE_PURGE_CONFIRMATION,
        summary,
        labels,
        mediaRelations: {
          relationRowsDeleted: relationRows,
          physicalFilesDeleted: orphanedMediaFileIds.length,
        },
        kept: COMMERCE_KEEP_TARGETS,
        needsConfirmation: COMMERCE_NEEDS_CONFIRMATION_TARGETS,
      };
    }

    const { summary, mediaRelationRows, commerceMediaFileIds } = await strapi.db.transaction(
      async ({ trx }) => {
        const fileIds = await collectCommerceMediaFileIds(strapi, trx);
        const deletionSummary = await deleteTargets(strapi, trx);
        const relationRowsDeleted = await deleteMediaRelations(strapi, trx);

        return {
          summary: deletionSummary,
          mediaRelationRows: relationRowsDeleted,
          commerceMediaFileIds: fileIds,
        };
      },
    );
    const orphanedMediaFileIds = await getOrphanedMediaFileIds(strapi, commerceMediaFileIds);
    const physicalFilesDeleted = await deleteUploadFiles(strapi, orphanedMediaFileIds);

    strapi.log.warn("Commerce data purge completed", {
      performedBy: options.performedBy?.id,
      summary,
      mediaRelationRows,
      physicalFilesDeleted,
    });

    await logManualActivity(strapi, {
      resourceType: "Other",
      action: "Delete",
      title: "Commerce data purged",
      message: "Commerce data purge completed by superadmin.",
      messageEn: "Commerce data purge completed by superadmin.",
      severity: "warning",
      description: "Deleted commerce records and orphaned product media while preserving users, social data, shipping, settings, gateways, and unrelated uploads.",
      metadata: {
        summary,
        mediaRelations: {
          relationRowsDeleted: mediaRelationRows,
          physicalFilesDeleted,
        },
        kept: COMMERCE_KEEP_TARGETS,
      },
      performedBy: options.performedBy,
      ip: options.ip,
      userAgent: options.userAgent,
    });

    return {
      dryRun: false,
      confirmationRequired: COMMERCE_PURGE_CONFIRMATION,
      summary,
      labels,
      mediaRelations: {
        relationRowsDeleted: mediaRelationRows,
        physicalFilesDeleted,
      },
      kept: COMMERCE_KEEP_TARGETS,
      needsConfirmation: COMMERCE_NEEDS_CONFIRMATION_TARGETS,
    };
  },
});
