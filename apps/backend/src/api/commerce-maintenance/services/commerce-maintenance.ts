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

      strapi.log.info("Commerce purge dry-run completed", {
        summary,
        mediaRelationRows: relationRows,
      });

      return {
        dryRun: true,
        confirmationRequired: COMMERCE_PURGE_CONFIRMATION,
        summary,
        labels,
        mediaRelations: {
          relationRowsDeleted: relationRows,
          physicalFilesDeleted: 0,
        },
        kept: COMMERCE_KEEP_TARGETS,
        needsConfirmation: COMMERCE_NEEDS_CONFIRMATION_TARGETS,
      };
    }

    const { summary, mediaRelationRows } = await strapi.db.transaction(
      async ({ trx }) => {
        const deletionSummary = await deleteTargets(strapi, trx);
        const relationRowsDeleted = await deleteMediaRelations(strapi, trx);

        return {
          summary: deletionSummary,
          mediaRelationRows: relationRowsDeleted,
        };
      },
    );

    strapi.log.warn("Commerce data purge completed", {
      performedBy: options.performedBy?.id,
      summary,
      mediaRelationRows,
      physicalFilesDeleted: 0,
    });

    await logManualActivity(strapi, {
      resourceType: "Other",
      action: "Delete",
      title: "Commerce data purged",
      message: "Commerce data purge completed by superadmin.",
      messageEn: "Commerce data purge completed by superadmin.",
      severity: "warning",
      description: "Deleted commerce records while preserving users, social data, shipping, settings, gateways, and uploads.",
      metadata: {
        summary,
        mediaRelations: {
          relationRowsDeleted: mediaRelationRows,
          physicalFilesDeleted: 0,
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
        physicalFilesDeleted: 0,
      },
      kept: COMMERCE_KEEP_TARGETS,
      needsConfirmation: COMMERCE_NEEDS_CONFIRMATION_TARGETS,
    };
  },
});
