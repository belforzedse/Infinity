import type { Order, OrderLog } from "@/services/order";

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    const dateText = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
    const timeText = new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    return `${timeText} - ${dateText}`;
  } catch {
    return "—";
  }
};

interface OrderTimelineProps {
  order: Order;
}

const getTimelineEvents = (order: Order): OrderLog[] => {
  const logs = [...(order.orderLogs ?? [])].sort((a, b) => {
    const aDate = new Date(a.createdAt ?? order.createdAt).getTime();
    const bDate = new Date(b.createdAt ?? order.createdAt).getTime();
    return aDate - bDate;
  });

  if (logs.length > 0) {
    return logs;
  }

  return [
    {
      id: -1,
      Action: "Create",
      Description: "سفارش ثبت شد",
      createdAt: order.createdAt,
    },
    {
      id: -2,
      Action: order.Status,
      Description: `وضعیت فعلی: ${order.Status}`,
      createdAt: order.updatedAt,
    },
  ];
};

export default function OrderTimeline({ order }: OrderTimelineProps) {
  const events = getTimelineEvents(order);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-foreground-primary">وضعیت سفارش</h2>
      <ol className="relative space-y-4 border-r border-slate-200 pr-4">
        {events.map((event) => (
          <li key={`${event.id}-${event.createdAt}`} className="relative">
            <span className="absolute -right-[31px] mt-1 h-4 w-4 rounded-full border-2 border-white bg-pink-500 shadow ring-2 ring-pink-100" />
            <div className="flex flex-col gap-1 text-right">
              <span className="text-sm font-medium text-foreground-primary">
                {event.Description || event.Action || "بروزرسانی"}
              </span>
              <span className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

