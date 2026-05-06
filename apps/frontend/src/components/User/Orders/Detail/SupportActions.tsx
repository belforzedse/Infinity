import Link from "next/link";
import PaymentStatusButton from "../PaymentStatusButton";
import ShowFactorButton from "../ShowFactorButton";

interface SupportActionsProps {
  orderId: number;
  shippingBarcode?: string;
}

export default function SupportActions({ orderId, shippingBarcode }: SupportActionsProps) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-foreground-primary">اقدامات بیشتر</h2>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <PaymentStatusButton orderId={orderId} />
        <ShowFactorButton />
        {shippingBarcode ? (
          <Link
            href={`https://anipo.ir/checkconsignment/?code=${shippingBarcode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-blue-200 px-4 py-2 text-blue-600 transition hover:bg-blue-50"
          >
            پیگیری بسته
          </Link>
        ) : null}
        <Link
          href="/contact"
          className="rounded-xl border border-slate-200 px-4 py-2 text-slate-600 transition hover:border-pink-200 hover:text-pink-600"
        >
          تماس با پشتیبانی
        </Link>
      </div>
    </section>
  );
}

