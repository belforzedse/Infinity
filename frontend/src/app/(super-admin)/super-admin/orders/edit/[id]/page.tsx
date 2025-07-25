"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import Footer from "@/components/SuperAdmin/Order/SummaryFooter";
import { config } from "./config";
import Sidebar from "@/components/SuperAdmin/Order/Sidebar";
import { useState, useEffect } from "react";
import { apiClient } from "@/services";
import { API_BASE_URL, STRAPI_TOKEN } from "@/constants/api";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ProductCoverImage } from "@/types/Product";

export type Order = {
  id: number;
  orderDate: Date;
  orderStatus: string;
  userId: string;
  userName: string;
  description: string;
  phoneNumber: string;
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
  total: number;
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

  useEffect(() => {
    setLoading(true);
    apiClient
      .get(
        `/orders/${id}?populate[0]=user&populate[1]=contract&populate[2]=order_items&populate[3]=shipping&populate[4]=order_items.product_variation.product.CoverImage&populate[5]=order_items.product_color&populate[6]=order_items.product_size&populate[7]=user.user_info`,
        {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
        }
      )
      .then((res) => {
        const data = (res as any).data as OrderResponse;
        const subtotal = data.attributes?.contract?.data?.attributes?.Amount;
        const total = +subtotal + +data.attributes?.ShippingCost;

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

        const userName =
          (data.attributes?.user?.data?.attributes?.user_info?.data?.attributes
            ?.FirstName || "") +
          " " +
          (data.attributes?.user?.data?.attributes?.user_info?.data?.attributes
            ?.LastName || "");

        setData({
          id: +data.id,
          createdAt: new Date(data.attributes?.createdAt),
          updatedAt: new Date(data.attributes?.updatedAt),
          description: data.attributes?.Description,
          orderDate: new Date(data.attributes?.Date),
          orderStatus: data.attributes?.Status,
          phoneNumber: data.attributes?.user?.data?.attributes?.Phone,
          shipping: data.attributes?.ShippingCost,
          userId: data.attributes?.user?.data?.id,
          userName: userName.trim() || data.attributes?.user?.data?.id,
          items: items,
          subtotal,
          total,
          contractStatus: data.attributes?.contract?.data?.attributes?.Status,
        });
      })
      .catch((err) => {
        setError(err.response.data.error);
        toast.error("خطایی رخ داده است");
      })
      .finally(() => {
        setLoading(false);
      });
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
      footer={<Footer order={data} />}
      // customSidebar={<Sidebar />}
    />
  );
}
