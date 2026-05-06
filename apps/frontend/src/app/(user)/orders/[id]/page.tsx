import type { Metadata } from "next";
import OrderDetailPageClient from "@/components/User/Orders/Detail/OrderDetailPageClient";
import { SITE_NAME } from "@/config/site";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { id: orderId } = await params;
  return {
    title: `جزئیات سفارش #${orderId} | ${SITE_NAME}`,
    description: "وضعیت، پرداخت و اطلاعات ارسال سفارش خود را مشاهده و پیگیری کنید.",
    alternates: {
      canonical: `/orders/${orderId}`,
    },
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  return <OrderDetailPageClient orderId={id} />;
}

