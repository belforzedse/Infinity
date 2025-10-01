'use strict';

/**
 * Migration: Add Code to shipping_provinces and populate province/city codes from SQL dump
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  async up(knex) {
    // Strapi handles columns via schema.json; this migration only populates data if columns exist
    const hasTable = await knex.schema.hasTable('shipping_provinces');
    if (!hasTable) return;

    const hasProvinceCode = await knex.schema.hasColumn('shipping_provinces', 'code');
    const hasCityCode = await knex.schema.hasColumn('shipping_cities', 'code');

    // Parse SQL dump to build code maps
    const sqlPath = path.resolve(__dirname, '..', '..', 'iran_cities (for api document) (2).sql');
    if (!fs.existsSync(sqlPath)) {
      console.warn('⚠️ SQL dump not found for province/city codes:', sqlPath);
      return;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    // Extract tuples like ('تهران','THR','تهران','1') possibly with spaces
    const tupleRegex = /\('([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\)/g;
    /** @type {Record<string,{provinceCode:string, cities:Record<string,string>}>} */
    const map = {};
    let m;
    while ((m = tupleRegex.exec(sql))) {
      const provinceName = (m[1] || '').trim();
      const provinceCode = (m[2] || '').trim();
      const cityName = (m[3] || '').trim().replace(/\s+/g, ' ');
      const cityCode = (m[4] || '').trim();
      if (!provinceName || !provinceCode || !cityName || !cityCode) continue;
      if (!map[provinceName]) map[provinceName] = { provinceCode, cities: {} };
      map[provinceName].cities[cityName] = cityCode;
    }

    // Update province codes
    const provinces = await knex('shipping_provinces').select('id', 'title', hasProvinceCode ? 'code' : knex.raw("'' as code"));
    for (const p of provinces) {
      const entry = map[p.title];
      if (!entry) {
        console.warn(`⚠️ Province not matched for code mapping: ${p.title}`);
        continue;
      }
      if (hasProvinceCode && !p.code) {
        await knex('shipping_provinces').where({ id: p.id }).update({ code: entry.provinceCode });
      }
    }

    // Update city codes by fuzzy matching titles
    if (!hasCityCode) return;
    const cities = await knex('shipping_cities').select('id', 'title', 'code');
    // Build province id → title map to lookup province name for better match using join table
    const links = await knex('shipping_cities_shipping_province_links').select('shipping_city_id', 'shipping_province_id');
    const provinceByCityId = {};
    for (const l of links) provinceByCityId[l.shipping_city_id] = l.shipping_province_id;
    const provinceTitleById = Object.fromEntries(provinces.map((p) => [p.id, p.title]));

    for (const c of cities) {
      if (c.code) continue;
      const provinceId = provinceByCityId[c.id];
      const provinceTitle = provinceTitleById[provinceId];
      const entry = map[provinceTitle];
      if (!entry) {
        console.warn(`⚠️ No province entry for city mapping: ${c.title} (provinceId=${provinceId})`);
        continue;
      }
      // Try exact and some normalized variants
      const candidates = [
        c.title,
        c.title.replace(/\s+/g, ' '),
        c.title.replace(/[\(\)\u200c]/g, ''),
      ];
      let foundCode = null;
      for (const name of candidates) {
        if (entry.cities[name]) { foundCode = entry.cities[name]; break; }
      }
      if (!foundCode) {
        // Attempt loose match by removing hyphens and non-letters
        const norm = (s) => s.replace(/[\-ـ\s]/g, '');
        const target = norm(c.title);
        for (const [k, v] of Object.entries(entry.cities)) {
          if (norm(k) === target) { foundCode = v; break; }
        }
      }
      if (foundCode) {
        await knex('shipping_cities').where({ id: c.id }).update({ code: foundCode });
      } else {
        console.warn(`⚠️ City not matched for code mapping: ${c.title} (province=${provinceTitle})`);
      }
    }
  },

  async down() {},
};


