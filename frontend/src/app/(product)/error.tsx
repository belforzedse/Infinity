'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Product page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-red-600">خطا!</h1>
          <p className="mt-2 text-gray-600">متأسفانه خطایی در بارگذاری صفحه رخ داده است.</p>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-700">
              <strong>Error details:</strong> {error.message}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full rounded-lg bg-pink-600 px-6 py-3 font-medium text-white transition-colors hover:bg-pink-700 active:scale-95"
          >
            تلاش دوباره
          </button>

          <Link href="/" className="block">
            <button className="w-full rounded-lg border border-pink-200 px-6 py-3 font-medium text-pink-600 transition-colors hover:bg-pink-50 active:scale-95">
              بازگشت به خانه
            </button>
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          اگر این مشکل ادامه دارد، لطفاً با پشتیبانی تماس بگیرید.
        </p>
      </div>
    </div>
  );
}
