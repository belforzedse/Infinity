import { unwrapCollection, unwrapEntity } from "@/utils/strapi";

const normalizeUserRelation = (user: any) => {
  const entity = unwrapEntity(user);
  if (!entity) return undefined;
  
  // Handle user_info in different possible formats
  let userInfo: any = undefined;
  // Check if user_info exists and is not null
  if (entity.user_info != null) {
    // Try unwrapping if it's in Strapi format
    userInfo = unwrapEntity(entity.user_info);
    // If unwrapEntity didn't change it, it might already be unwrapped
    if (userInfo === entity.user_info && entity.user_info?.data) {
      // Try accessing the nested structure directly
      const nested = unwrapEntity(entity.user_info.data);
      if (nested) userInfo = nested;
    }
  }
  
  return {
    data: {
      id: String(entity.id ?? ""),
      attributes: {
        Phone: entity.Phone ?? entity.phone ?? "",
        // Preserve null structure if user_info was null, otherwise set to undefined if no data
        user_info: userInfo && (userInfo.FirstName || userInfo.LastName)
          ? {
              data: {
                id: String(userInfo.id ?? ""),
                attributes: {
                  FirstName: userInfo.FirstName ?? "",
                  LastName: userInfo.LastName ?? "",
                },
              },
            }
          : entity.user_info === null ? null : undefined,
      },
    },
  };
};

const normalizeOrderItems = (items: any) => {
  const collection = unwrapCollection(items);
  return {
    data: collection
      .map((item: any) => {
        const entity = unwrapEntity(item);
        if (!entity) return null;
        const pv = unwrapEntity(entity.product_variation);
        const product = unwrapEntity(pv?.product);
        const color = unwrapEntity(entity.product_color);
        const size = unwrapEntity(entity.product_size);
        return {
          id: String(entity.id ?? ""),
          attributes: {
            Count: Number(entity.Count ?? entity.Quantity ?? 1),
            PerAmount: Number(entity.PerAmount ?? entity.UnitPrice ?? 0),
            ProductSKU: entity.ProductSKU ?? pv?.SKU ?? "—",
            ProductTitle: entity.ProductTitle ?? product?.Title ?? "—",
            product_color: color
              ? {
                  data: {
                    id: String(color.id ?? ""),
                    attributes: color,
                  },
                }
              : undefined,
            product_size: size
              ? {
                  data: {
                    id: String(size.id ?? ""),
                    attributes: size,
                  },
                }
              : undefined,
          },
        };
      })
      .filter(Boolean),
  };
};

const normalizeDeliveryAddress = (address: any) => {
  const entity = unwrapEntity(address);
  if (!entity) return undefined;
  const city = unwrapEntity(entity.shipping_city);
  const province = unwrapEntity(city?.shipping_province);
  const fullAddress = [entity.FullAddress, city?.Title, province?.Title]
    .filter(Boolean)
    .join(" - ");
  return {
    data: {
      id: String(entity.id ?? ""),
      attributes: {
        ...entity,
        FullAddress: fullAddress || entity.FullAddress,
        shipping_city: city
          ? {
              data: {
                id: String(city.id ?? ""),
                attributes: {
                  ...city,
                  shipping_province: province
                    ? {
                        data: {
                          id: String(province.id ?? ""),
                          attributes: province,
                        },
                      }
                    : undefined,
                },
              },
            }
          : undefined,
      },
    },
  };
};

const normalizeShipping = (shipping: any) => {
  const entity = unwrapEntity(shipping);
  if (!entity) return undefined;
  return {
    data: {
      id: String(entity.id ?? ""),
      attributes: {
        ...entity,
        Name: entity.Name ?? entity.Title ?? entity.name ?? "",
      },
    },
  };
};

const normalizeContract = (contract: any) => {
  const entity = unwrapEntity(contract);
  if (!entity) return undefined;
  const transactions = unwrapCollection(entity.contract_transactions).map((tx: any) => {
    const txEntity = unwrapEntity(tx);
    const gateway = unwrapEntity(txEntity?.payment_gateway);
    return {
      id: String(txEntity?.id ?? ""),
      attributes: {
        ...txEntity,
        payment_gateway: gateway
          ? {
              data: {
                id: String(gateway.id ?? ""),
                attributes: gateway,
              },
            }
          : undefined,
      },
    };
  });
  return {
    data: {
      id: String(entity.id ?? ""),
      attributes: {
        ...entity,
        contract_transactions: {
          data: transactions,
        },
      },
    },
  };
};

export const normalizeOrderForInvoice = (raw: any, fallbackId?: string) => {
  const normalizedOrder = unwrapEntity(raw?.data ?? raw);
  if (!normalizedOrder) return null;

  const attributesSource = normalizedOrder.attributes
    ? { ...normalizedOrder.attributes }
    : { ...normalizedOrder };

  const contractEntity = unwrapEntity(attributesSource.contract ?? normalizedOrder.contract);
  const contractTransactions = unwrapCollection(contractEntity?.contract_transactions);
  const lastTx = contractTransactions[contractTransactions.length - 1];
  const paymentGateway =
    unwrapEntity(lastTx?.payment_gateway)?.Title ||
    contractEntity?.payment_gateway ||
    attributesSource.PaymentGateway ||
    normalizedOrder.PaymentGateway;

  const normalizedOrderItems = normalizeOrderItems(attributesSource.order_items ?? normalizedOrder.order_items);
  const normalizedUser = normalizeUserRelation(attributesSource.user ?? normalizedOrder.user);
  const normalizedDeliveryAddress = normalizeDeliveryAddress(
    attributesSource.delivery_address ?? normalizedOrder.delivery_address,
  );
  const normalizedShipping = normalizeShipping(attributesSource.shipping ?? normalizedOrder.shipping);
  const normalizedContract = normalizeContract(attributesSource.contract ?? normalizedOrder.contract);

  const finalAttributes = {
    ...attributesSource,
    paymentGateway,
    user: normalizedUser ?? attributesSource.user,
    contract: normalizedContract ?? attributesSource.contract,
    order_items: normalizedOrderItems,
    delivery_address: normalizedDeliveryAddress ?? attributesSource.delivery_address,
    shipping: normalizedShipping ?? attributesSource.shipping,
  };

  return {
    id: String(normalizedOrder.id ?? attributesSource.id ?? fallbackId ?? ""),
    attributes: finalAttributes,
  };
};

