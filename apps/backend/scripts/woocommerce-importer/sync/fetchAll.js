/**
 * Paginated fetch helper for Strapi REST endpoints.
 */

function getAttr(entity, field) {
  if (entity?.attributes && entity.attributes[field] !== undefined) {
    return entity.attributes[field];
  }
  return entity?.[field];
}

/**
 * @param {import('../utils/ApiClient').StrapiClient} strapiClient
 * @param {string} endpoint
 * @param {Record<string, unknown>} [params]
 * @param {number} [pageSize]
 */
async function fetchAll(strapiClient, endpoint, params = {}, pageSize = 100) {
  let page = 1;
  let items = [];
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await strapiClient.get(endpoint, {
      "pagination[pageSize]": pageSize,
      "pagination[page]": page,
      ...params,
    });

    const data = Array.isArray(response?.data) ? response.data : [];
    items = items.concat(data);
    totalPages = response?.meta?.pagination?.pageCount || 1;
    page += 1;
  }

  return items;
}

module.exports = {
  fetchAll,
  getAttr,
};
