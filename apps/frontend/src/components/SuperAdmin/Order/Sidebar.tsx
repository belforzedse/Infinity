"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/services";
import AnipoBarcodeDialog from "./AnipoBarcodeDialog";
import { translateOrderLogMessage } from "@/utils/statusTranslations";
import SuperAdminOrderLogs from "./SuperAdminOrderLogs";
import { type OrderTimelineEvent } from "@/components/User/Orders/Detail/OrderTimeline";
import type { SuperAdminOrderDetail, SuperAdminOrderItem } from "@/types/super-admin/order";
import toast from "react-hot-toast";

interface SuperAdminOrderSidebarProps {
  orderData?: SuperAdminOrderDetail;
  selectedItems?: SuperAdminOrderItem[];
  shippingBarcode?: string;
}

type OrderLog = {
  id: number;
  attributes: {
    createdAt: string;
    Description?: string;
    Changes?: any;
  };
};

export default function SuperAdminOrderSidebar({
  orderData,
  selectedItems = [],
  shippingBarcode
}: SuperAdminOrderSidebarProps = {}) {
  const router = useRouter();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    message: "",
    type: "sms",
  });
  const [orderLogs, setOrderLogs] = useState<OrderLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<"events" | "audit">("events");
  const [readableEventCount, setReadableEventCount] = useState(0);
  const handleReadableEventsChange = useCallback(
    (events: OrderTimelineEvent[]) => {
      setReadableEventCount(events.length);
    },
    [],
  );

  const timelineOrderId = orderData?.id ?? (id ? Number(id) : undefined);
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasBarcode, setHasBarcode] = useState(!!shippingBarcode);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!id) return;
      try {
        setLogsLoading(true);
        const res = await apiClient.get(
          `/order-logs?filters[order][id][$eq]=${id}&sort[0]=createdAt:desc` as any,
        );
        setOrderLogs(((res as any).data || []) as OrderLog[]);
      } catch (error) {
        console.error("Error fetching order logs:", error);
      } finally {
        setLogsLoading(false);
      }
    };
    fetchLogs();
  }, [id]);

  useEffect(() => {
    setReadableEventCount(0);
  }, [orderData?.id]);

  useEffect(() => {
    setHasBarcode(!!shippingBarcode);
  }, [shippingBarcode]);

  const handleGenerateBarcode = async (weight?: number, boxSizeId?: number) => {
    if (!id) return;
    setIsGenerating(true);
    try {
      const mod = await import("@/services/order");
      const res = await mod.default.generateAnipoBarcode(parseInt(String(id)), weight, boxSizeId);

      if (res?.success || res?.already) {
        setHasBarcode(true);
        toast.success(res?.already ? "بارکد قبلاً ثبت شده است" : "بارکد با موفقیت ایجاد شد");
      } else {
        toast.success("درخواست ارسال شد");
      }

      setShowBarcodeDialog(false);
      // Refresh page to reflect barcode changes
      router.refresh();
    } catch (e) {
      toast.error("خطا در ایجاد بارکد Anipo");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPreInvoice = () => {
    if (!orderData || selectedItems.length === 0) {
      toast.error("لطفا ابتدا محصولات را اضافه کنید");
      return;
    }

    // Create a temporary order object in Strapi format for the Invoice component
    const tempOrder = {
      id: 'temp-preview',
      attributes: {
        Date: orderData.orderDate?.toISOString() || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        Description: orderData.description || '',
        ShippingCost: orderData.shipping || 0,
        user: {
          data: {
            attributes: {
              Phone: orderData.phoneNumber || '',
              user_info: {
                data: {
                  attributes: {
                    FirstName: orderData.userName?.split(' ')[0] || '',
                    LastName: orderData.userName?.split(' ').slice(1).join(' ') || '',
                  }
                }
              }
            }
          }
        },
        delivery_address: {
          data: {
            attributes: {
              FullAddress: orderData.address || '',
              PostalCode: orderData.postalCode || '',
            }
          }
        },
        order_items: {
          data: selectedItems.map((item, index) => ({
            id: index.toString(),
            attributes: {
              Count: item.quantity,
              PerAmount: item.price,
              ProductTitle: item.productName,
              ProductSKU: item.productCode,
            }
          }))
        },
        contract: {
          data: {
            attributes: {
              Amount: orderData.total || 0
            }
          }
        }
      }
    };

    // Store temp order data in sessionStorage
    sessionStorage.setItem('tempPreInvoiceOrder', JSON.stringify(tempOrder));

    // Open print page with pre-invoice flag
    const printUrl = `/super-admin/orders/print/temp-preview?type=pre-invoice`;
    try {
      const printWindow = window.open(printUrl, '_blank', 'noopener,noreferrer');
      if (!printWindow) {
        toast.error('لطفا اجازه باز کردن پنجره جدید را بدهید');
      }
    } catch (error) {
      toast.error('خطا در باز کردن پیش‌فاکتور');
    }

    // Clean up after a delay
    setTimeout(() => {
      sessionStorage.removeItem('tempPreInvoiceOrder');
    }, 10000);
  };

  return (
    <div className="sticky top-5 flex flex-col gap-3">
      {/* Notification to User */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-lg text-foreground-primary">ارسال اعلان به مشتری</span>

            <span className="text-sm text-neutral-400">
              ارسال پیامک به شماره {orderData?.phoneNumber || "---"}
            </span>
          </div>

          <div className="w-full overflow-hidden rounded-lg border border-neutral-200">
            <select
              className={`text-sm w-full border-l-[20px] border-transparent px-5 py-3`}
              value={formData.type}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  type: e.target.value,
                });
              }}
            >
              <option value="sms">پیامک</option>
              {/* <option value="email">ایمیل</option> */}
            </select>
          </div>

          <textarea
            rows={3}
            placeholder="متن اعلان"
            className={`text-sm w-full rounded-lg border border-neutral-200 px-5 py-2`}
            value={formData.message}
            onChange={(e) => {
              setFormData({
                ...formData,
                message: e.target.value,
              });
            }}
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={async () => {
              if (!formData.message.trim()) {
                toast.error("لطفا متن پیام را وارد کنید");
                return;
              }
              if (!orderData?.phoneNumber) {
                toast.error("شماره تماس مشتری موجود نیست");
                return;
              }
              try {
                // TODO: Implement actual SMS/notification API call
                toast.success("پیام با موفقیت ارسال شد");
                setFormData({ ...formData, message: "" });
              } catch (error) {
                toast.error("خطا در ارسال پیام");
              }
            }}
            className="flex items-center gap-1 rounded-md bg-actions-primary px-2 py-1 hover:brightness-110 transition-colors"
          >
            <span className="text-sm text-white">ارسال پیام</span>

            <SendIcon />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-lg text-foreground-primary">فاکتور</span>

            <span className="text-sm text-neutral-400">شماره فاکتور: 841649</span>
          </div>

          <div className="flex w-full gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (id) {
                  try {
                    window.open(`/super-admin/orders/print/${id}`, "_blank", "noopener,noreferrer");
                  } catch (error) {
                    toast.error("خطا در باز کردن پنجره چاپ");
                  }
                } else {
                  toast.error("لطفا ابتدا سفارش را ذخیره کنید");
                }
              }}
              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-slate-100 py-1.5"
              type="button"
            >
              <span className="text-sm text-neutral-500">دانلود فاکتور</span>

              <DownloadIcon />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (id) {
                  try {
                    window.open(`/super-admin/orders/print/${id}`, "_blank", "noopener,noreferrer");
                  } catch (error) {
                    toast.error("خطا در باز کردن پنجره چاپ");
                  }
                } else {
                  toast.error("لطفا ابتدا سفارش را ذخیره کنید");
                }
              }}
              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-slate-100 py-1.5"
              type="button"
            >
              <span className="text-sm text-neutral-500">پرینت فاکتور</span>

              <PrintIcon />
            </button>
          </div>

          {/* Anipo Barcode Button - Full Width */}
          <div className="flex w-full mt-2">
            {hasBarcode ? (
              <button
                className="flex w-full items-center justify-center gap-1 rounded-md bg-green-50 py-1.5 text-green-600 cursor-default"
                type="button"
                disabled
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <span className="text-sm">بارکد صادر شده</span>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (id) {
                    setShowBarcodeDialog(true);
                  } else {
                    toast.error("لطفا ابتدا سفارش را ذخیره کنید");
                  }
                }}
                disabled={isGenerating}
                className="flex w-full items-center justify-center gap-1 rounded-md bg-orange-50 py-1.5 text-orange-600 hover:bg-orange-100 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 5V19H21V5H3Z"></path>
                  <path d="M12 8V16"></path>
                  <path d="M8 12H16"></path>
                </svg>
                <span className="text-sm">صدور بارکد Anipo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-lg text-foreground-primary">اعلانات سفارش</span>
        </div>

        {/* Tabs for Events and Audit Logs */}
        <div className="flex gap-2 border-b border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveLogTab("events")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeLogTab === "events"
                ? "border-b-2 border-pink-500 text-pink-600"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            رویدادها ({readableEventCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveLogTab("audit")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeLogTab === "audit"
                ? "border-b-2 border-pink-500 text-pink-600"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            لاگ‌های فنی ({orderLogs.length})
          </button>
        </div>

        {activeLogTab === "events" ? (
          <SuperAdminOrderLogs
            orderId={timelineOrderId}
            hideHeader
            onEventsChange={handleReadableEventsChange}
          />
        ) : (
          <>
            {logsLoading ? (
              <div className="text-sm text-neutral-400">در حال بارگذاری...</div>
            ) : orderLogs.length === 0 ? (
              <div className="text-sm text-neutral-400">اعلانی ثبت نشده است</div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                {orderLogs.map((log, index) => {
                  const date = new Date(log.attributes.createdAt);
                  const formattedDate = date.toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  });
                  const formattedTime = date.toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isEven = index % 2 === 0;

                  return (
                    <div
                      key={log.id}
                      className={`rounded-lg p-3 ${
                        isEven ? "bg-blue-50" : "bg-purple-50"
                      }`}
                    >
                      <div className="text-sm text-foreground-primary mb-1">
                        {translateOrderLogMessage(log.attributes.Description) || "ثبت رویداد"}
                      </div>
                      {log.attributes.Changes && (
                        <pre className="mt-1 whitespace-pre-wrap break-all text-xs text-neutral-500 mb-1">
                          {JSON.stringify(log.attributes.Changes, null, 2)}
                        </pre>
                      )}
                      <div className="text-xs text-neutral-500 mt-1">
                        {formattedDate} در {formattedTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <AnipoBarcodeDialog
        isOpen={showBarcodeDialog}
        onClose={() => setShowBarcodeDialog(false)}
        onGenerate={handleGenerateBarcode}
        loading={isGenerating}
      />
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.46041 10.0894L9.95991 3.34685C10.1459 2.84435 9.65691 2.35535 9.15441 2.54135L2.40891 5.04285C1.83141 5.25685 1.87691 6.08785 2.47391 6.23785L5.50741 6.99985L6.26491 10.0238C6.41441 10.6213 7.24591 10.6674 7.46041 10.0894V10.0894Z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.2502 14.6667V3"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.75 14.6667C17.75 16.5075 16.2575 18 14.4167 18H6.08333C4.2425 18 2.75 16.5075 2.75 14.6667"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.4167 10.5L10.2492 14.6675L6.08252 10.5"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.5835 7.16667V3.83333C6.5835 3.37333 6.95683 3 7.41683 3H14.0835C14.5435 3 14.9168 3.37333 14.9168 3.83333V7.16667"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.58333 14.6667H4.91667C3.99583 14.6667 3.25 13.9209 3.25 13V8.83335C3.25 7.91252 3.99583 7.16669 4.91667 7.16669H16.5833C17.5042 7.16669 18.25 7.91252 18.25 8.83335V13C18.25 13.9209 17.5042 14.6667 16.5833 14.6667H14.9167"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.5835 12H14.9168V17.1667C14.9168 17.6267 14.5435 18 14.0835 18H7.41683C6.95683 18 6.5835 17.6267 6.5835 17.1667V12Z"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5835 9.66667H7.41683"
        stroke="#64748B"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Removed unused PlusIcon
