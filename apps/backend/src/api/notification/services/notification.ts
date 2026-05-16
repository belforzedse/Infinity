// @ts-nocheck
/**
 * notification service
 *
 * All notification creation goes through this service so that failures
 * never surface to the caller (wrapped in try/catch, logged only).
 */

import { factories } from "@strapi/strapi";

type NotificationKind = "site_message" | "comment_reply" | "comment_approved" | "comment_liked";

interface NotifyParams {
  recipientId: number;
  kind: NotificationKind;
  actorId?: number;
  actorName?: string;
  postId?: number;
  title?: string;
  body?: string;
  link?: string;
}

export default factories.createCoreService("api::notification.notification", ({ strapi }) => ({
  async notify(params: NotifyParams) {
    try {
      const { recipientId, kind, actorId, actorName, postId, title, body, link } = params;
      if (!recipientId) return null;

      await strapi.entityService.create("api::notification.notification", {
        data: {
          recipient: recipientId,
          ...(actorId ? { actor: actorId } : {}),
          ...(postId ? { post: postId } : {}),
          Kind: kind,
          Title: title ?? "",
          Body: body ?? "",
          ActorName: actorName ?? "",
          Link: link ?? "/",
          IsRead: false,
        },
      });
    } catch (err) {
      strapi.log.error("[notification.service] Failed to create notification:", err);
      return null;
    }
  },

  async createWelcome(recipientId: number) {
    return this.notify({
      recipientId,
      kind: "site_message",
      title: "به اینفینیتی خوش آمدید",
      body: "حساب شما با موفقیت ساخته شد. از کاوش پست‌ها لذت ببرید.",
      link: "/",
    });
  },

  async createCommentReply(params: {
    recipientId: number;
    actorId: number;
    actorName: string;
    postId: number;
  }) {
    const { recipientId, actorId, actorName, postId } = params;
    if (!recipientId || recipientId === actorId) return null;
    return this.notify({
      recipientId,
      kind: "comment_reply",
      actorId,
      actorName,
      postId,
      title: "پاسخ به دیدگاه شما",
      body: `${actorName} به دیدگاه شما پاسخ داد`,
      link: `/posts/${postId}`,
    });
  },

  async createCommentApproved(params: { recipientId: number; postId: number }) {
    const { recipientId, postId } = params;
    if (!recipientId) return null;
    return this.notify({
      recipientId,
      kind: "comment_approved",
      postId,
      title: "دیدگاه شما تایید شد",
      body: "دیدگاه شما منتشر شد و اکنون برای همه نمایش داده می‌شود.",
      link: `/posts/${postId}`,
    });
  },

  async createCommentLiked(params: {
    recipientId: number;
    actorId: number;
    actorName: string;
    postId: number;
  }) {
    const { recipientId, actorId, actorName, postId } = params;
    if (!recipientId || recipientId === actorId) return null;
    return this.notify({
      recipientId,
      kind: "comment_liked",
      actorId,
      actorName,
      postId,
      title: "پسندیدن دیدگاه",
      body: `${actorName} دیدگاه شما را پسندید`,
      link: `/posts/${postId}`,
    });
  },
}));
