import type { Strapi } from "@strapi/strapi";

type ContractStatus =
  | "Not Ready"
  | "Confirmed"
  | "Finished"
  | "Failed"
  | "Cancelled";
type ContractType = "Cash" | "Credit";

export const createContract = async (
  strapi: Strapi,
  userId: number,
  orderId: number,
  amount: number,
  taxPercent: number,
  trx?: any
) => {
  // Validate inputs
  if (amount < 0) {
    throw new Error("INVALID_AMOUNT: Contract amount cannot be negative");
  }
  if (taxPercent < 0 || taxPercent > 100) {
    throw new Error("INVALID_TAX_PERCENT: Tax percent must be between 0 and 100");
  }

  const contractData = {
    local_user: userId,
    Type: "Cash" as ContractType,
    Status: "Not Ready" as ContractStatus,
    Amount: Math.round(amount),
    Date: new Date(),
    TaxPercent: taxPercent,
    order: orderId,
  };

  try {
    return await strapi.db.query("api::contract.contract").create({
      data: contractData,
      ...(trx ? { transacting: trx } : {}),
    });
  } catch (error: any) {
    strapi.log.error("Failed to create contract:", {
      userId,
      orderId,
      amount,
      error: error.message,
    });
    throw new Error(`CONTRACT_CREATION_FAILED: ${error.message}`);
  }
};
