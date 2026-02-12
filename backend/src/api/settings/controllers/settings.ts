/**
 * settings controller
 */

import type { Attribute } from "@strapi/types";
import { factories } from "@strapi/strapi";
import {
  createHeroSliderMeta,
  normalizeStoredHeroSliderPayload,
  sanitizeHeroSliderPayload,
} from "../services/hero-slider-schema";

/** Sanitized payload is valid JSON; cast for Strapi JSON fields which expect Attribute.JsonValue. */
function toStrapiJson<T>(v: T): Attribute.JsonValue {
  return v as unknown as Attribute.JsonValue;
}

const SETTINGS_UID = "api::settings.settings";

async function ensureSettingsEntity(strapi: any) {
  const existing = await strapi.db.query(SETTINGS_UID).findOne({ where: {} });
  if (existing) {
    return existing;
  }

  return strapi.entityService.create(SETTINGS_UID, {
    data: {},
  });
}

function extractPayloadFromRequestBody(body: any) {
  if (body && typeof body === "object" && body.data !== undefined) {
    return body.data;
  }
  return body;
}

export default factories.createCoreController(SETTINGS_UID, ({ strapi }) => ({
  async getHeroSlider(ctx) {
    const settingsEntity = await ensureSettingsEntity(strapi);

    const draft = normalizeStoredHeroSliderPayload(settingsEntity.homeHeroSliderDraft);
    const published = normalizeStoredHeroSliderPayload(settingsEntity.homeHeroSliderPublished);
    const meta =
      settingsEntity.homeHeroSliderMeta && typeof settingsEntity.homeHeroSliderMeta === "object"
        ? settingsEntity.homeHeroSliderMeta
        : {};

    ctx.body = {
      data: {
        draft,
        published,
        meta,
      },
    };
  },

  async updateHeroSliderDraft(ctx) {
    const payload = extractPayloadFromRequestBody(ctx.request.body);
    const { value, errors } = sanitizeHeroSliderPayload(payload);

    if (errors.length > 0) {
      return ctx.badRequest("Invalid hero slider draft payload", {
        errors,
      });
    }

    const settingsEntity = await ensureSettingsEntity(strapi);
    const updated = await strapi.entityService.update(SETTINGS_UID, settingsEntity.id, {
      data: {
        homeHeroSliderDraft: toStrapiJson(value),
      },
    });

    ctx.body = {
      data: {
        draft: normalizeStoredHeroSliderPayload(updated.homeHeroSliderDraft),
      },
    };
  },

  async publishHeroSliderDraft(ctx) {
    const settingsEntity = await ensureSettingsEntity(strapi);
    const { value, errors } = sanitizeHeroSliderPayload(settingsEntity.homeHeroSliderDraft);

    if (errors.length > 0) {
      return ctx.badRequest("Cannot publish invalid hero slider draft", {
        errors,
      });
    }

    const publishedBy =
      ctx.state?.user && Number.isFinite(Number(ctx.state.user.id))
        ? Number(ctx.state.user.id)
        : null;
    const meta = createHeroSliderMeta(publishedBy);

    const updated = await strapi.entityService.update(SETTINGS_UID, settingsEntity.id, {
      data: {
        homeHeroSliderPublished: toStrapiJson(value),
        homeHeroSliderMeta: toStrapiJson(meta),
      },
    });

    ctx.body = {
      data: {
        published: normalizeStoredHeroSliderPayload(updated.homeHeroSliderPublished),
        meta: updated.homeHeroSliderMeta,
      },
    };
  },
}));
