import type { Strapi } from "@strapi/strapi";
import fs from "node:fs/promises";
import path from "node:path";

type CityPayload = { province: string; cities: string[] };
type ShippingSeed = { Title: string; Price: number; IsActive?: boolean | null };

const DEFAULT_SHIPPINGS: ShippingSeed[] = [
  { Title: "ارسال با پست", Price: 69000, IsActive: true },
  { Title: "ارسال با تیپاکس", Price: 79000, IsActive: true },
  { Title: "ارسال با پیک", Price: 25000, IsActive: true },
  { Title: "دریافت حضوری", Price: 0, IsActive: true },
];

export async function ensureIranLocations(strapi: Strapi) {
  try {
    const forceReseed = process.env.FORCE_RESEED === "true";
    const provinceCount = await strapi.db.query("api::shipping-province.shipping-province").count();
    const cityCount = await strapi.db.query("api::shipping-city.shipping-city").count();
    const shippingCount = await strapi.db.query("api::shipping.shipping").count();
    const shouldSeedLocations = forceReseed || provinceCount === 0 || cityCount === 0;
    const shouldSeedShippings = forceReseed || shippingCount === 0;

    if (!forceReseed && provinceCount > 0 && cityCount > 0) {
      strapi.log.info(
        "✓ Iran locations already seeded (provinces=%d cities=%d). Set FORCE_RESEED=true to re-seed.",
        provinceCount,
        cityCount,
      );
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
      if (shouldSeedShippings) {
        strapi.log.info("⟳ Clearing existing shippings (count=%d)...", shippingCount);
        await strapi.db.query("api::shipping.shipping").deleteMany();
      }
      strapi.log.info("✓ Cleared existing provinces and cities");
    }

    const provinceIdMap = new Map<string, number>();
    let finalCityCount = cityCount;

    if (shouldSeedLocations) {
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

      if (!jsonExists) {
        strapi.log.error(
          "✗ Iran locations bootstrap FAILED - missing files (json: %s, sql: %s). App root: %s",
          "✗ MISSING",
          sqlExists ? "✓ found" : "✗ MISSING",
          appRoot,
        );
        return;
      }

      if (!sqlExists) {
        strapi.log.warn(
          "⚠️ iran_cities SQL not found at %s. Proceeding without province/city codes; Titles will still be seeded.",
          sqlPath,
        );
      }

      strapi.log.info("✓ Found seed files (JSON required, SQL optional), starting import...");

      const raw = await fs.readFile(jsonPath, "utf8");
      const payload: CityPayload[] = JSON.parse(raw);

      const provinceCodeMap = new Map<string, string>();
      const cityCodeMap = new Map<string, Map<string, string>>();
      if (sqlExists) {
        const sql = await fs.readFile(sqlPath, "utf8");
        const tupleRegex = /\('([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\)/g;
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
      }

      // Insert provinces with codes
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

      finalCityCount = await strapi.db.query("api::shipping-city.shipping-city").count();
    } else {
      strapi.log.info("↷ Skipped province/city seed (already present and FORCE_RESEED not set)");
    }

    if (shouldSeedShippings) {
      const existingShippings = await strapi.db.query("api::shipping.shipping").findMany({
        select: ["Title"],
      });
      const existingTitles = new Set(
        (existingShippings || []).map((s: { Title?: string }) => (s?.Title || "").trim()),
      );

      let createdCount = 0;
      for (const seed of DEFAULT_SHIPPINGS) {
        const normalized = (seed.Title || "").trim();
        if (!normalized || existingTitles.has(normalized)) continue;
        await strapi.entityService.create("api::shipping.shipping", {
          data: {
            Title: normalized,
            Price: seed.Price,
            IsActive: seed.IsActive ?? true,
            removedAt: null,
          },
        });
        createdCount += 1;
      }
      strapi.log.info("✓ Seeded shipping methods: added %d new entries", createdCount);
    } else {
      strapi.log.info("↷ Skipped shipping seed (existing shippings found and FORCE_RESEED not set)");
    }

    const totalProvinces = shouldSeedLocations ? provinceIdMap.size : provinceCount;
    strapi.log.info(
      "✓ SEEDING COMPLETE: provinces=%d, cities=%d, shippings=%d",
      totalProvinces,
      finalCityCount,
      await strapi.db.query("api::shipping.shipping").count(),
    );
  } catch (error) {
    strapi.log.error("✗ SEEDING FAILED: Iran locations bootstrap error:", error);
  }
}
