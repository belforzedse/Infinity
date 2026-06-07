'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== 'undefined') {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md rounded-3xl bg-white p-8 shadow-xl">
            <div className="mb-6 text-center">
              <div className="mb-4 text-6xl">⚠️</div>
              <h1 className="text-3xl font-bold text-red-600">خطای سرور</h1>
              <p className="mt-2 text-gray-600">متأسفانه خطایی غیرمنتظره رخ داده است.</p>
            </div>

            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-6 rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {error.message}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs text-red-600">
                    <strong>Digest:</strong> {error.digest}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full rounded-lg bg-infinity-primary px-6 py-3 font-medium text-white transition-colors hover:bg-infinity-primary-dark active:scale-95"
              >
                تلاش دوباره
              </button>

              <Link href="/" className="block">
                <button className="w-full rounded-lg border border-infinity-primary-lighter/60 px-6 py-3 font-medium text-infinity-primary transition-colors hover:bg-infinity-primary-lighter/20 active:scale-95">
                  بازگشت به خانه
                </button>
              </Link>
            </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          ما در حال رفع این مشکل هستیم. لطفاً بعداً دوباره تلاش کنید.
        </p>
      </div>
    </div>
  );
}
