"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import AnipoBarcodeLabel from "@/components/SuperAdmin/Order/AnipoBarcodeLabel";

type Order = {
  id: string;
  attributes: {
    ShippingBarcode?: string;
    Description?: string;
    createdAt: string;
    user: {
      data: {
        attributes: {
          Phone: string;
          user_info: {
            data: {
              attributes: {
                FirstName: string;
                LastName: string;
              };
            };
          };
        };
      };
    };
    delivery_address?: {
      data: {
        attributes: {
          FullAddress: string;
          shipping_city: {
            data: {
              attributes: {
                Title: string;
                shipping_province: {
                  data: {
                    attributes: {
                      Title: string;
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
    contract?: {
      data: {
        attributes: {
          Amount: number;
        };
      };
    };
  };
};

export default function AnipoBarcodePrintPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const hasPrinted = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          `/orders/${id}?populate[0]=user&populate[1]=user.user_info&populate[2]=delivery_address.shipping_city.shipping_province&populate[3]=contract`,
          { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
        );

        setOrder((res as any).data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (order && order.attributes.ShippingBarcode && !hasPrinted.current) {
      hasPrinted.current = true;
      const timeout = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timeout);
    }
  }, [order]);

  useEffect(() => {
    const afterPrint = () => {
      hasPrinted.current = false;
    };

    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  if (loading || !order) {
    return (
      <div className="anipo-loading">
        در حال بارگذاری...
      </div>
    );
  }

  if (!order.attributes.ShippingBarcode) {
    return (
      <div className="anipo-loading">
        بارکد برای این سفارش موجود نیست
      </div>
    );
  }

  // Prepare data for the label component
  const userInfo = order.attributes.user?.data?.attributes;
  const fullName = `${userInfo?.user_info?.data?.attributes?.FirstName || ""} ${userInfo?.user_info?.data?.attributes?.LastName || ""}`.trim();

  const addressData = order.attributes.delivery_address?.data?.attributes;
  const city = addressData?.shipping_city?.data?.attributes?.Title || "گرگان";
  const province = addressData?.shipping_city?.data?.attributes?.shipping_province?.data?.attributes?.Title || "";

  const amount = order.attributes.contract?.data?.attributes?.Amount || 0;
  const orderDate = new Date(order.attributes.createdAt);

  // Format date and time in Persian
  const formattedDate = orderDate.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const formattedTime = orderDate.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const labelProps = {
    packageNumber: id?.toString() || "1",
    packageSize: "سایز بسته ۱",
    origin: "میدا",
    destination: city,
    weight: "۱۰۰ گرم",
    time: formattedTime,
    date: formattedDate,
    fare: `${amount.toLocaleString()} ریال`,
    barcodeNumber: order.attributes.ShippingBarcode,
    recipientName: fullName,
    recipientPhone: userInfo?.Phone || "",
    recipientAddress: [addressData?.FullAddress, city, province].filter(Boolean).join(" - ")
  };

  return <AnipoBarcodeLabel {...labelProps} />;
}
