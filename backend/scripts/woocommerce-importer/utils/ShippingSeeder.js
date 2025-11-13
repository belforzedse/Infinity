const fs = require('fs/promises');
const path = require('path');
const { StrapiClient } = require('./ApiClient');

const JSON_FILENAME = 'iran-cities.json';
const SQL_FILENAME = 'iran_cities (for api document) (2).sql';

const tupleRegex = /\('([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\)/g;

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadSeedData(projectRoot, logger) {
  const jsonPath = path.resolve(projectRoot, 'database', JSON_FILENAME);
  const sqlPath = path.resolve(projectRoot, 'database', SQL_FILENAME);

  const jsonExists = await fileExists(jsonPath);
  const sqlExists = await fileExists(sqlPath);

  if (!jsonExists) {
    throw new Error(`Missing ${JSON_FILENAME} file at ${jsonPath}`);
  }

  if (!sqlExists) {
    logger.warn(
      `⚠️  Missing SQL file "${SQL_FILENAME}". Provinces and cities will be synced without codes.`
    );
  }

  const payloadRaw = await fs.readFile(jsonPath, 'utf8');
  const payload = JSON.parse(payloadRaw);

  const provinceCodeMap = new Map();
  const cityCodeMap = new Map();

  if (sqlExists) {
    const sqlRaw = await fs.readFile(sqlPath, 'utf8');
    let match;
    while ((match = tupleRegex.exec(sqlRaw))) {
      const provinceName = (match[1] || '').trim();
      const provinceCode = (match[2] || '').trim();
      const cityName = (match[3] || '').trim();
      const cityCode = (match[4] || '').trim();
      if (!provinceName || !provinceCode || !cityName) continue;
      if (provinceCode) {
        provinceCodeMap.set(provinceName, provinceCode);
      }
      if (!cityCodeMap.has(provinceName)) {
        cityCodeMap.set(provinceName, new Map());
      }
      if (cityCode) {
        cityCodeMap.get(provinceName).set(cityName, cityCode);
      }
    }
  }

  return { payload, provinceCodeMap, cityCodeMap };
}

async function syncShippingLocations(config, logger) {
  const projectRoot = path.resolve(__dirname, '../../..');
  logger.info('🚚 Starting shipping provinces/cities sync');
  logger.debug(`Project root resolved to ${projectRoot}`);

  const { payload, provinceCodeMap, cityCodeMap } = await loadSeedData(projectRoot, logger);
  const strapiClient = new StrapiClient(config, logger);

  const stats = {
    provincesCreated: 0,
    provincesUpdated: 0,
    citiesCreated: 0,
    citiesUpdated: 0,
  };

  logger.info('📦 Syncing %d provinces', payload.length);

  for (const entry of payload) {
    const title = entry.province?.trim();
    if (!title) continue;
    const desiredProvinceCode = provinceCodeMap.get(title) || null;

    let provinceRecord = await strapiClient.findShippingProvinceByTitle(title);
    let provinceId = provinceRecord?.id;

    if (!provinceRecord) {
      const created = await strapiClient.createShippingProvince({
        Title: title,
        Code: desiredProvinceCode,
      });
      provinceRecord = created;
      provinceId = created?.id;
      stats.provincesCreated += 1;
      logger.info(
        `➕ Created province "${title}"${desiredProvinceCode ? ` (${desiredProvinceCode})` : ''}`
      );
    } else if (
      desiredProvinceCode &&
      provinceRecord?.attributes?.Code !== desiredProvinceCode
    ) {
      await strapiClient.updateShippingProvince(provinceRecord.id, { Code: desiredProvinceCode });
      stats.provincesUpdated += 1;
      logger.info(`♻️  Updated province code for "${title}" → ${desiredProvinceCode}`);
    }

    if (!provinceId) {
      logger.warn(`⚠️  Unable to determine province ID for "${title}", skipping its cities.`);
      continue;
    }

    const cityCodes = cityCodeMap.get(title) || new Map();
    const cities = Array.isArray(entry.cities) ? entry.cities : [];

    for (const cityTitleRaw of cities) {
      const cityTitle = cityTitleRaw?.trim();
      if (!cityTitle) continue;

      const desiredCityCode = cityCodes.get(cityTitle) || null;
      const existingCity = await strapiClient.findShippingCity(cityTitle, provinceId);

      if (!existingCity) {
        await strapiClient.createShippingCity({
          Title: cityTitle,
          Code: desiredCityCode,
          shipping_province: provinceId,
        });
        stats.citiesCreated += 1;
      } else if (
        desiredCityCode &&
        existingCity?.attributes?.Code !== desiredCityCode
      ) {
        await strapiClient.updateShippingCity(existingCity.id, { Code: desiredCityCode });
        stats.citiesUpdated += 1;
      }
    }
  }

  logger.success(
    '✅ Shipping sync complete — provinces: +%d created, %d updated | cities: +%d created, %d updated',
    stats.provincesCreated,
    stats.provincesUpdated,
    stats.citiesCreated,
    stats.citiesUpdated
  );

  return stats;
}

module.exports = {
  syncShippingLocations,
};
