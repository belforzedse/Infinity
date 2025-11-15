/**
 * discount controller
 */

import { factories } from "@strapi/strapi";

type DiscountNumericField =
  | "Amount"
  | "LimitAmount"
  | "LimitUsage"
  | "MinCartTotal"
  | "MaxCartTotal";

const NUMERIC_FIELDS: DiscountNumericField[] = [
  "Amount",
  "LimitAmount",
  "LimitUsage",
  "MinCartTotal",
  "MaxCartTotal",
];

class DiscountNumericValidationError extends Error {
  field: DiscountNumericField;

  constructor(field: DiscountNumericField, message: string) {
    super(message);
    this.field = field;
    this.name = "DiscountNumericValidationError";
  }
}

const coerceNumericValue = (
  field: DiscountNumericField,
  raw: unknown,
): number | null | undefined => {
  if (raw === undefined) {
    return undefined;
  }

  if (raw === null) {
    return null;
  }

  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) {
      throw new DiscountNumericValidationError(field, `${field} must be a valid number`);
    }
    return Math.round(raw);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();

    if (!trimmed) {
      return null;
    }

    const lowered = trimmed.toLowerCase();
    if (lowered === "null") {
      return null;
    }
    if (lowered === "undefined") {
      return undefined;
    }

    const normalized = trimmed
      .replace(/[,٬\s]/g, "")
      .replace(/[%٪]/g, "");

    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) {
      throw new DiscountNumericValidationError(field, `${field} must be a valid number`);
    }

    return Math.round(parsed);
  }

  throw new DiscountNumericValidationError(field, `${field} must be a valid number`);
};

const normalizeDiscountInput = (data: Record<string, unknown> | undefined) => {
  if (!data || typeof data !== "object") {
    return;
  }

  for (const field of NUMERIC_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) {
      continue;
    }

    const parsedValue = coerceNumericValue(field, (data as Record<string, unknown>)[field]);
    if (parsedValue === undefined) {
      delete (data as Record<string, unknown>)[field];
    } else {
      (data as Record<string, unknown>)[field] = parsedValue;
    }
  }
};

export default factories.createCoreController("api::discount.discount", ({ strapi }) => ({
  async create(ctx) {
    try {
      normalizeDiscountInput(ctx.request.body?.data);
    } catch (error) {
      strapi.log.warn("Discount create payload rejected", {
        error: (error as Error)?.message,
        field: error instanceof DiscountNumericValidationError ? error.field : undefined,
      });
      return ctx.badRequest(
        error instanceof DiscountNumericValidationError ? error.message : "Invalid discount payload",
        {
          data: { success: false, field: error instanceof DiscountNumericValidationError ? error.field : undefined },
        },
      );
    }

    return await super.create(ctx);
  },

  async update(ctx) {
    try {
      normalizeDiscountInput(ctx.request.body?.data);
    } catch (error) {
      strapi.log.warn("Discount update payload rejected", {
        discountId: ctx.params?.id,
        error: (error as Error)?.message,
        field: error instanceof DiscountNumericValidationError ? error.field : undefined,
      });
      return ctx.badRequest(
        error instanceof DiscountNumericValidationError ? error.message : "Invalid discount payload",
        {
          data: { success: false, field: error instanceof DiscountNumericValidationError ? error.field : undefined },
        },
      );
    }

    return await super.update(ctx);
  },
}));
