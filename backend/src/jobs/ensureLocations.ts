import type { Strapi } from "@strapi/strapi";
import fs from "node:fs/promises";
import path from "node:path";

type CityPayload = { province: string; cities: string[] };

export async function ensureIranLocations(strapi: Strapi) {
  try {
    const provinceCount = await strapi.db.query("api::shipping-province.shipping-province").count();
    const cityCount = await strapi.db.query("api::shipping-city.shipping-city").count();
    if (provinceCount > 0 && cityCount > 0) {
      strapi.log.info("Iran locations already seeded (provinces=%s cities=%s)", provinceCount, cityCount);
      return;
    }

    const jsonPath = path.resolve(strapi.dirs.app.root, "database/iran-cities.json");
    const sqlPath = path.resolve(
      strapi.dirs.app.root,
      "database/iran_cities (for api document) (2).sql",
    );

    const [jsonExists, sqlExists] = await Promise.all([
      fs
        .access(jsonPath)
        .then(() => true)
        .catch(() => false),
      fs
        .access(sqlPath)
        .then(() => true)
        .catch(() => false),
    ]);
    if (!jsonExists || !sqlExists) {
      strapi.log.warn(
        "Iran locations bootstrap skipped (json: %s, sql: %s)",
        jsonExists ? "found" : "missing",
        sqlExists ? "found" : "missing",
      );
      return;
    }

    const raw = await fs.readFile(jsonPath, "utf8");
    const payload: CityPayload[] = JSON.parse(raw);

    const sql = await fs.readFile(sqlPath, "utf8");
    const tupleRegex = /\('([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\)/g;
    const provinceCodeMap = new Map<string, string>();
    const cityCodeMap = new Map<string, Map<string, string>>();
    let match;
    while ((match = tupleRegex.exec(sql))) {
      const provinceName = (match[1] || "").trim();
      const provinceCode = (match[2] || "").trim();
      const cityName = (match[3] || "").trim();
      const cityCode = (match[4] || "").trim();
      if (!provinceName || !provinceCode || !cityName || !cityCode) continue;
      provinceCodeMap.set(provinceName, provinceCode);
      if (!cityCodeMap.has(provinceName)) cityCodeMap.set(provinceName, new Map());
      cityCodeMap.get(provinceName)!.set(cityName, cityCode);
    }

    // Insert provinces with codes
    const provinceIdMap = new Map<string, number>();
    for (const entry of payload) {
      const existing = await strapi.db.query("api::shipping-province.shipping-province").findOne({
        where: { Title: entry.province },
      });
      if (existing) {
        provinceIdMap.set(entry.province, existing.id);
        continue;
      }
      const created = await strapi.entityService.create("api::shipping-province.shipping-province", {
        data: {
          Title: entry.province,
          Code: provinceCodeMap.get(entry.province) || null,
        },
        fields: ["id"],
      }) as { id: number };
      provinceIdMap.set(entry.province, Number(created.id));
    }

    // Insert cities referencing provinces
    for (const entry of payload) {
      const provinceId = provinceIdMap.get(entry.province);
      if (!provinceId) continue;
      const cityCodes = cityCodeMap.get(entry.province) || new Map();
      for (const cityTitle of entry.cities) {
        const existing = await strapi.db.query("api::shipping-city.shipping-city").findOne({
          where: { Title: cityTitle, shipping_province: provinceId },
        });
        if (existing) continue;
        await strapi.entityService.create("api::shipping-city.shipping-city", {
          data: {
            Title: cityTitle,
            shipping_province: provinceId,
            Code: cityCodes.get(cityTitle) || null,
          },
        });
      }
    }

    strapi.log.info("Seeded Iranian provinces (%s) and cities (%s)", provinceIdMap.size, await strapi.db.query("api::shipping-city.shipping-city").count());
  } catch (error) {
    strapi.log.error("Failed seeding Iran locations", error);
  }
}
