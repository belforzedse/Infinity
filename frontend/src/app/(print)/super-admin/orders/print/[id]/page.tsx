"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { apiClient } from "@/services";
import Invoice from "@/components/invoice";
import { unwrapCollection, unwrapEntity } from "@/utils/strapi";

type StrapiOrderResponse = {
  id?: string;
  attributes?: any; // raw from Strapi, will be transformed
  data?: {
    id?: string;
    attributes?: any;
  };
};

const normalizeUserRelation = (user: any) => {
  const entity = unwrapEntity(user);
  if (!entity) return undefined;
  const userInfo = unwrapEntity(entity.user_info);
  return {
    data: {
      id: String(entity.id ?? ""),
      attributes: {
        Phone: entity.Phone ?? entity.phone ?? "",
        user_info: userInfo
          ? {
              data: {
                id: String(userInfo.id ?? ""),
                attributes: {
                  FirstName: userInfo.FirstName ?? "",
                  LastName: userInfo.LastName ?? "",
                },
              },
            }
          : { data: undefined },
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

export default function PrintOrderPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hasPrinted = useRef(false);
  const isPreInvoice = searchParams.get('type') === 'pre-invoice';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Handle temp pre-invoice case
        if (id === 'temp-preview') {
          const tempOrderData = sessionStorage.getItem('tempPreInvoiceOrder');
          if (tempOrderData) {
            const tempOrder = JSON.parse(tempOrderData);
            setOrder(tempOrder);
            return;
          } else {
            throw new Error('No temp order data found');
          }
        }

        const res = await apiClient.get(
          `/orders/${id}?populate[0]=user
         &populate[1]=contract
         &populate[2]=order_items
         &populate[3]=order_items.product_variation.product.CoverImage
         &populate[4]=user.user_info
         &populate[5]=delivery_address.shipping_city.shipping_province
         &populate[6]=shipping
         &populate[7]=contract.contract_transactions.payment_gateway`,
        );

        const raw: StrapiOrderResponse = (res as any).data;
        const normalizedOrder = unwrapEntity(raw?.data ?? raw);

        if (!normalizedOrder) {
          throw new Error("سفارش پیدا نشد");
        }

        const attributesSource = normalizedOrder.attributes
          ? { ...normalizedOrder.attributes }
          : { ...normalizedOrder };

        const contractEntity = unwrapEntity(
          attributesSource.contract ?? normalizedOrder.contract,
        );
        const contractTransactions = unwrapCollection(
          contractEntity?.contract_transactions,
        );
        const lastTx = contractTransactions[contractTransactions.length - 1];
        const paymentGateway =
          unwrapEntity(lastTx?.payment_gateway)?.Title ||
          contractEntity?.payment_gateway ||
          attributesSource.PaymentGateway ||
          normalizedOrder.PaymentGateway;

        const normalizedOrderItems = normalizeOrderItems(
          attributesSource.order_items ?? normalizedOrder.order_items,
        );
        const normalizedUser = normalizeUserRelation(
          attributesSource.user ?? normalizedOrder.user,
        );
        const normalizedDeliveryAddress = normalizeDeliveryAddress(
          attributesSource.delivery_address ?? normalizedOrder.delivery_address,
        );
        const normalizedShipping = normalizeShipping(
          attributesSource.shipping ?? normalizedOrder.shipping,
        );
        const normalizedContract = normalizeContract(
          attributesSource.contract ?? normalizedOrder.contract,
        );

        const finalAttributes = {
          ...attributesSource,
          paymentGateway,
          user: normalizedUser ?? attributesSource.user,
          contract: normalizedContract ?? attributesSource.contract,
          order_items: normalizedOrderItems,
          delivery_address: normalizedDeliveryAddress ?? attributesSource.delivery_address,
          shipping: normalizedShipping ?? attributesSource.shipping,
        };

        setOrder({
          id: String(normalizedOrder.id ?? attributesSource.id ?? id),
          attributes: finalAttributes,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (order && !hasPrinted.current) {
      hasPrinted.current = true;
      const timeout = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timeout);
    }
  }, [order]);

  useEffect(() => {
    const afterPrint = () => {
      hasPrinted.current = false; // optional if you want to allow reprint on revisit
    };

    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  if (loading || !order) return <div className="p-6">در حال بارگذاری…</div>;

  return <Invoice order={order} isPreInvoice={isPreInvoice} />;
}
