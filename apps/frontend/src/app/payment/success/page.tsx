import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/config/site';
import PaymentSuccessPageClient from './PaymentSuccessPageClient';

export const metadata: Metadata = {
  title: `پرداخت موفق | ${SITE_NAME}`,
  description: "نتیجه پرداخت شما ثبت شد. می‌توانید جزئیات سفارش را مشاهده کنید.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/payment/success`,
  },
};

export default function PaymentSuccess() {
  return <PaymentSuccessPageClient />;
}

