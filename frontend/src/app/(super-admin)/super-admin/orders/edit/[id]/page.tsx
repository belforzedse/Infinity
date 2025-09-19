"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import Footer from "@/components/SuperAdmin/Order/SummaryFooter";
import GatewayLogs from "@/components/SuperAdmin/Order/GatewayLogs";
import { config } from "./config";
import Sidebar from "@/components/SuperAdmin/Order/Sidebar";
import { useState, useEffect } from "react";
import { apiClient } from "@/services";
import { API_BASE_URL, STRAPI_TOKEN } from "@/constants/api";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ProductCoverImage } from "@/types/Product";
import { apiClient as _ } from "@/services";

export type Order = {
  id: number;
  orderDate: Date;
  orderStatus: string;
  userId: string;
  userName: string;
  description: string;
  phoneNumber: string;
  address?: string;
  postalCode?: string;
  paymentGateway?: string;
  createdAt: Date;
  contractStatus:
    | "Not Ready"
    | "Confirmed"
    | "Finished"
    | "Failed"
    | "Cancelled";
  updatedAt: Date;
  items: OrderItem[];
  shipping: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  // Anipo fields
  shippingBarcode?: string;
  shippingPostPrice?: number;
  shippingTax?: number;
  shippingWeight?: number;
  shippingBoxSizeId?: number;
};

type OrderResponse = {
  id: string;
  attributes: {
    createdAt: string;
    updatedAt: string;
    Description: string;
    Date: string;
    Status: string;
    ShippingCost: number;
    ShippingBarcode?: string;
    ShippingPostPrice?: number;
    ShippingTax?: number;
    ShippingWeight?: number;
    ShippingBoxSizeId?: number;
    delivery_address?: {
      data: {
        id: string;
        attributes: {
          PostalCode?: string;
          FullAddress?: string;
          shipping_city?: {
            data: {
              id: string;
              attributes: {
                Title?: string;
                shipping_province?: {
                  data: { id: string; attributes: { Title?: string } };
                };
              };
            };
          };
        };
      };
    };
    contract: {
      data: {
        attributes: {
          Amount: number;
          Status:
            | "Not Ready"
            | "Confirmed"
            | "Finished"
            | "Failed"
            | "Cancelled";
          contract_transactions?: {
            data: Array<{
              id: string;
              attributes: {
                Type?: string;
                Status?: string;
                Date?: string;
                payment_gateway?: {
                  data: { id: string; attributes: { Title?: string } };
                };
              };
            }>;
          };
        };
      };
    };
    user: {
      data: {
        id: string;
        attributes: {
          Phone: string;
          user_info: {
            data: {
              id: string;
              attributes: {
                FirstName: string;
                LastName: string;
              };
            };
          };
        };
      };
    };
    order_items: {
      data: {
        id: string;
        attributes: {
          Count: number;
          PerAmount: number;
          ProductTitle: string;
          ProductSKU: string;
          product_variation: {
            data: {
              id: string;
              attributes: {
                product: {
                  data: {
                    id: string;
                    attributes: {
                      CoverImage: ProductCoverImage;
                    };
                  };
                };
              };
            };
          };
          product_color: {
            data: {
              id: string;
              attributes: {
                Title: string;
              };
            };
          };
          product_size: {
            data: {
              id: string;
              attributes: {
                Title: string;
              };
            };
          };
        };
      }[];
    };
  };
};

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  color: string;
  image: string;
};

export default function EditOrderPage() {
  const [data, setData] = useState<Order>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { id } = useParams();

  const load = () => {
    setLoading(true);
    return apiClient
      .get(
        `/orders/${id}?populate[0]=user&populate[1]=contract&populate[2]=order_items&populate[3]=shipping&populate[4]=order_items.product_variation.product.CoverImage&populate[5]=order_items.product_color&populate[6]=order_items.product_size&populate[7]=user.user_info&populate[8]=delivery_address.shipping_city.shipping_province&populate[9]=contract.contract_transactions.payment_gateway`,
        {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
        }
      )
      .then((res) => {
        const data = (res as any).data as OrderResponse;

        const items = data.attributes?.order_items?.data?.map((item) => ({
          id: +item.id,
          productId: +item.attributes?.product_variation?.data?.id,
          productName: item.attributes?.ProductTitle,
          productCode: item.attributes?.ProductSKU,
          price: item.attributes?.PerAmount,
          quantity: item.attributes?.Count,
          color: item.attributes?.product_color?.data?.attributes?.Title,
          size: item.attributes?.product_size?.data?.attributes?.Title,
          image:
            API_BASE_URL.split("/api")[0] +
            item.attributes?.product_variation?.data?.attributes?.product?.data
              ?.attributes?.CoverImage?.data?.attributes?.formats?.thumbnail
              ?.url,
        }));

        // Compute financials
        const shippingCost = Number(data.attributes?.ShippingCost || 0);
        const itemsSubtotal = (items || []).reduce(
          (sum: number, it: any) =>
            sum + Number(it.price || 0) * Number(it.quantity || 0),
          0
        );
        const contractAmount = Number(
          data.attributes?.contract?.data?.attributes?.Amount || 0
        );
        const taxPercent = Number(
          (data.attributes?.contract?.data?.attributes as any)?.TaxPercent || 10
        );
        // Use items subtotal for "موارد جمع جزء" and contract amount (already includes shipping/tax) for total.
        const subtotal = itemsSubtotal;
        const total = contractAmount || itemsSubtotal + shippingCost;
        // Derive discount and tax from identities:
        // total = subtotal - discount + tax + shipping
        // tax = (subtotal - discount) * (taxPercent/100)
        const r = taxPercent / 100;
        const preTaxBase = (total - shippingCost) / (1 + r); // equals (subtotal - discount)
        const discount = Math.max(0, Math.round(subtotal - preTaxBase));
        const tax = Math.max(0, Math.round(preTaxBase * r));

        const userName =
          (data.attributes?.user?.data?.attributes?.user_info?.data?.attributes
            ?.FirstName || "") +
          " " +
          (data.attributes?.user?.data?.attributes?.user_info?.data?.attributes
            ?.LastName || "");

        const addr = data.attributes?.delivery_address?.data?.attributes;
        const city = addr?.shipping_city?.data?.attributes?.Title;
        const province =
          addr?.shipping_city?.data?.attributes?.shipping_province?.data
            ?.attributes?.Title;
        const fullAddress = [addr?.FullAddress, city, province]
          .filter(Boolean)
          .join(" - ");

        // Extract last gateway used from latest successful or pending contract transaction
        const txList =
          data.attributes?.contract?.data?.attributes?.contract_transactions
            ?.data || [];
        const lastTx = txList[txList.length - 1]?.attributes;
        const paymentGateway =
          lastTx?.payment_gateway?.data?.attributes?.Title || undefined;

        setData({
          id: +data.id,
          createdAt: new Date(data.attributes?.createdAt),
          updatedAt: new Date(data.attributes?.updatedAt),
          description: data.attributes?.Description,
          orderDate: new Date(data.attributes?.Date),
          orderStatus: data.attributes?.Status,
          phoneNumber: data.attributes?.user?.data?.attributes?.Phone,
          address: fullAddress || undefined,
          postalCode: addr?.PostalCode,
          paymentGateway,
          shipping: shippingCost,
          userId: data.attributes?.user?.data?.id,
          userName: userName.trim() || data.attributes?.user?.data?.id,
          items: items,
          subtotal,
          discount,
          tax,
          total,
          contractStatus: data.attributes?.contract?.data?.attributes?.Status,
          shippingBarcode: data.attributes?.ShippingBarcode,
          shippingPostPrice: data.attributes?.ShippingPostPrice,
          shippingTax: data.attributes?.ShippingTax,
          shippingWeight: data.attributes?.ShippingWeight,
          shippingBoxSizeId: data.attributes?.ShippingBoxSizeId,
        });
      })
      .catch((err) => {
        setError(err.response?.data?.error || "error");
        toast.error("خطایی رخ داده است");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <UpsertPageContentWrapper<Order>
      config={config}
      data={data}
      onSubmit={async (data) => {
        apiClient
          .put(
            `/orders/${id}`,
            {
              data: {
                Status: data.orderStatus,
                Description: data.description,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${STRAPI_TOKEN}`,
              },
            }
          )
          .then((res) => {
            toast.success("سفارش با موفقیت ویرایش شد");
          })
          .catch((err) => {
            toast.error("خطایی رخ داده است");
          });
      }}
      footer={
        <>
          <Footer order={data} onReload={load} />
          {data?.id ? <GatewayLogs orderId={data.id} /> : null}
        </>
      }
      customSidebar={<Sidebar />}
    />
  );
}
