import type { ContractTransaction, Order } from "@/services/order";
import { faNum } from "@/utils/faNum";
import { getPaymentStatusMeta, translatePaymentStatus } from "@/utils/statusTranslations";

const formatPrice = (amount: number) => `${faNum(amount)} تومان`;

const calculateSubtotal = (order: Order): number =>
  order.order_items.reduce((sum, item) => sum + Number(item.Count || 0) * Number(item.PerAmount || 0), 0);

const calculateDiscount = (order: Order): number => {
  if (typeof order.contract?.DiscountAmount === "number") {
    return Number(order.contract.DiscountAmount);
  }
  const fallback = (order as any).AppliedDiscountAmount;
  return typeof fallback === "number" ? Number(fallback) : 0;
};

interface PaymentSummaryCardProps {
  order: Order;
}

const toneToClass = (tone: ReturnType<typeof getPaymentStatusMeta>["tone"]) => {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-600";
    case "warning":
      return "bg-amber-50 text-amber-600";
    case "danger":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const TransactionList = ({ transactions }: { transactions: ContractTransaction[] }) => {
  if (!transactions.length) {
    return (
      <p className="text-xs text-slate-500">
        پرداختی برای این سفارش ثبت نشده است. در صورتی که پرداخت را تکمیل کرده‌اید، روی دکمه بررسی وضعیت پرداخت کلیک کنید.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex flex-col gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex flex-col">
            <span className="font-medium text-foreground-primary">
              {transaction.payment_gateway?.Title || "درگاه پرداخت"}
            </span>
            <span className="text-xs text-slate-500">
              {transaction.Type === "Gateway" ? "پرداخت آنلاین" : "پرداخت دستی"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium text-slate-700">{formatPrice(Number(transaction.Amount || 0))}</span>
            {(() => {
              const meta = getPaymentStatusMeta(transaction.Status);
              return (
                <span className={`rounded-full px-2 py-0.5 ${toneToClass(meta.tone)}`}>
                  {translatePaymentStatus(transaction.Status)}
                </span>
              );
            })()}
            {transaction.TrackId ? <span>شماره پیگیری: {transaction.TrackId}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function PaymentSummaryCard({ order }: PaymentSummaryCardProps) {
  const subtotal = calculateSubtotal(order);
  const shipping = Number(order.ShippingCost || 0);
  const discount = calculateDiscount(order);
  const total = Math.max(subtotal + shipping - discount, 0);
  const transactions = order.contract_transactions ?? [];

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-foreground-primary">خلاصه پرداخت</h2>
      <div className="flex flex-col gap-2 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <span>جمع اقلام</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>هزینه ارسال</span>
          <span>{formatPrice(shipping)}</span>
        </div>
        {discount > 0 ? (
          <div className="flex items-center justify-between text-emerald-600">
            <span>تخفیف اعمال‌شده</span>
            <span>- {formatPrice(discount)}</span>
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-foreground-primary">
          <span>مبلغ نهایی</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground-primary">تراکنش‌ها</h3>
        <TransactionList transactions={transactions} />
      </div>
    </section>
  );
}

