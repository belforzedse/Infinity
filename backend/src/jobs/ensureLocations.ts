import type { Strapi } from "@strapi/strapi";
import fs from "node:fs/promises";
import path from "node:path";

type CityPayload = { province: string; cities: string[] };

export async function ensureIranLocations(strapi: Strapi) {
  try {
    const forceReseed = process.env.FORCE_RESEED === "true";
    const provinceCount = await strapi.db.query("api::shipping-province.shipping-province").count();
    const cityCount = await strapi.db.query("api::shipping-city.shipping-city").count();

    if (!forceReseed && provinceCount > 0 && cityCount > 0) {
      strapi.log.info(
        "✓ Iran locations already seeded (provinces=%d cities=%d). Set FORCE_RESEED=true to re-seed.",
        provinceCount,
        cityCount,
      );
      return;
    }

    if (forceReseed && (provinceCount > 0 || cityCount > 0)) {
      strapi.log.info(
        "⟳ FORCE_RESEED enabled. Clearing existing data (provinces=%d cities=%d)...",
        provinceCount,
        cityCount,
      );
      // Clear existing data for re-seeding
      await strapi.db.query("api::shipping-city.shipping-city").deleteMany();
      await strapi.db.query("api::shipping-province.shipping-province").deleteMany();
      strapi.log.info("✓ Cleared existing provinces and cities");
    }

    const appRoot = strapi.dirs.app.root;
    const jsonPath = path.resolve(appRoot, "database/iran-cities.json");
    const sqlPath = path.resolve(appRoot, "database/iran_cities (for api document) (2).sql");

    strapi.log.info("🔍 Checking for seed files...");
    strapi.log.debug("  JSON path: %s", jsonPath);
    strapi.log.debug("  SQL path: %s", sqlPath);

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
      strapi.log.error(
        "✗ Iran locations bootstrap FAILED - missing files (json: %s, sql: %s). App root: %s",
        jsonExists ? "✓ found" : "✗ MISSING",
        sqlExists ? "✓ found" : "✗ MISSING",
        appRoot,
      );
      return;
    }

    strapi.log.info("✓ Found seed files, starting import...");

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

    const finalCityCount = await strapi.db.query("api::shipping-city.shipping-city").count();
    strapi.log.info(
      "✓ SEEDING COMPLETE: Added provinces (%d) and cities (%d)",
      provinceIdMap.size,
      finalCityCount,
    );
  } catch (error) {
    strapi.log.error("✗ SEEDING FAILED: Iran locations bootstrap error:", error);
  }
}
