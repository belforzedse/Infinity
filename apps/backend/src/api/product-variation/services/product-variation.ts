/**
 * product-variation service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::product-variation.product-variation', ({ strapi }) => ({
  /**
   * Custom create method with discount price validation
   */
  async create(params: any) {
    // Validate discount price if provided
    const { DiscountPrice, Price } = params.data;

    if (DiscountPrice !== undefined && DiscountPrice !== null && DiscountPrice > 0) {
      if (Price === undefined || Price === null) {
        throw new Error('قیمت اصلی الزامی است');
      }
      if (DiscountPrice >= Price) {
        throw new Error('قیمت تخفیف باید کمتر از قیمت اصلی باشد');
      }
    }

    return await super.create(params);
  },

  /**
   * Custom update method with discount price validation
   */
  async update(entityId: any, params: any) {
    const { DiscountPrice, Price } = params.data || {};

    // If either price field is being updated, validate the combination
    if (DiscountPrice !== undefined || Price !== undefined) {
      // Fetch current entity to get existing values
      const existing = await strapi.entityService.findOne(
        'api::product-variation.product-variation',
        entityId,
        { fields: ['Price', 'DiscountPrice'] }
      );

      if (!existing) {
        throw new Error('محصول یافت نشد');
      }

      // Use updated values or fall back to existing ones
      const finalPrice = Price !== undefined ? Price : existing.Price;
      const finalDiscountPrice = DiscountPrice !== undefined ? DiscountPrice : existing.DiscountPrice;

      // Validate if discount price is set and greater than 0
      if (finalDiscountPrice !== null && finalDiscountPrice > 0) {
        if (finalPrice === null || finalPrice === undefined) {
          throw new Error('قیمت اصلی الزامی است');
        }
        if (finalDiscountPrice >= finalPrice) {
          throw new Error('قیمت تخفیف باید کمتر از قیمت اصلی باشد');
        }
      }
    }

    return await super.update(entityId, params);
  },
}));
