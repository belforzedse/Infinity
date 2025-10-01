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
  taxPercent: number
) => {
  const contractData = {
    local_user: userId,
    Type: "Cash" as ContractType,
    Status: "Not Ready" as ContractStatus,
    Amount: Math.round(amount),
    Date: new Date(),
    TaxPercent: taxPercent,
    order: orderId,
  };

  return await strapi.entityService.create("api::contract.contract", {
    data: contractData,
  });
};
