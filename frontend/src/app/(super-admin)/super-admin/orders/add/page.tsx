"use client";
import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { createConfig } from "./config";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import toast from "react-hot-toast";
import logger from "@/utils/logger";
import { useRouter } from "next/navigation";
import { useState } from "react";
import UserSearchSection from "@/components/SuperAdmin/Order/UserSearchSection";
import ProductSelectionSection from "@/components/SuperAdmin/Order/ProductSelectionSection";
import Footer from "@/components/SuperAdmin/Order/SummaryFooter";
import Sidebar from "@/components/SuperAdmin/Order/Sidebar";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";

export type Order = {
  id: number;
  orderDate: Date;
  orderStatus: string;
  userId: string;
  userName?: string;
  description: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  postalCode?: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  shipping: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  contractStatus:
    | "Not Ready"
    | "Confirmed"
    | "Finished"
    | "Failed"
    | "Cancelled";
  total: number;
  paymentToken?: string | null;
};

type OrderItem = {
  id: number;
  productId: number;
  productVariationId?: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  color: string;
  size?: string;
  image: string;
};

export default function Page() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [pendingSubmitData, setPendingSubmitData] = useState<Order | null>(null);
  const [orderData, setOrderData] = useState<Order>({
    id: 0, // New order
    orderDate: new Date(),
    orderStatus: "Started",
    userId: '',
    userName: '',
    description: '',
    phoneNumber: '',
    email: '',
    address: '',
    postalCode: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    shipping: 0,
    subtotal: 0,
    discount: 0,
    tax: 0,
    contractStatus: "Not Ready",
    total: 0,
    paymentToken: null,
  });

  // Track which fields are auto-filled vs manually edited
  const [fieldStates, setFieldStates] = useState({
    userName: { isAutoFilled: false, isEditable: true },
    phoneNumber: { isAutoFilled: false, isEditable: true }, // Start editable when no user selected
    email: { isAutoFilled: false, isEditable: true },
    address: { isAutoFilled: false, isEditable: true },
    postalCode: { isAutoFilled: false, isEditable: true },
    subtotal: { isAutoFilled: false, isEditable: true },
    discount: { isAutoFilled: false, isEditable: true },
    tax: { isAutoFilled: false, isEditable: true },
    total: { isAutoFilled: false, isEditable: true },
    shipping: { isAutoFilled: false, isEditable: true },
  });

  const calculateTotals = (items: OrderItem[], shipping: number = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = orderData.discount || 0;
    const taxPercent = 0; // Tax disabled
    const preTaxAmount = subtotal - discount;
    const tax = Math.max(0, Math.round(preTaxAmount * (taxPercent / 100)));
    const total = subtotal - discount + tax + shipping;

    return { subtotal, tax, total };
  };

  const handleItemsChange = (items: OrderItem[]) => {
    setSelectedItems(items);
    const { subtotal, tax, total } = calculateTotals(items, orderData.shipping || 0);
    setOrderData(prev => ({
      ...prev,
      items,
      subtotal,
      tax,
      total
    }));

    // Mark financial fields as auto-filled when calculated from products
    if (items.length > 0) {
      setFieldStates(prev => ({
        ...prev,
        subtotal: { isAutoFilled: true, isEditable: false },
        tax: { isAutoFilled: true, isEditable: false },
        total: { isAutoFilled: true, isEditable: false },
      }));
    } else {
      setFieldStates(prev => ({
        ...prev,
        subtotal: { isAutoFilled: false, isEditable: true },
        tax: { isAutoFilled: false, isEditable: true },
        total: { isAutoFilled: false, isEditable: true },
      }));
    }
  };

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);

    // Handle null user (when clearing selection)
    if (!user) {
      // Reset to initial editable state
      setFieldStates(prev => ({
        ...prev,
        userName: { isAutoFilled: false, isEditable: true },
        phoneNumber: { isAutoFilled: false, isEditable: true },
        email: { isAutoFilled: false, isEditable: true },
        address: { isAutoFilled: false, isEditable: true },
        postalCode: { isAutoFilled: false, isEditable: true },
      }));

      // Clear auto-filled data
      setOrderData(prev => ({
        ...prev,
        userId: '',
        userName: '',
        phoneNumber: '',
        email: '',
        address: '',
        postalCode: '',
      }));
      return;
    }

    const firstName = user.attributes.user_info?.data?.attributes?.FirstName || '';
    const lastName = user.attributes.user_info?.data?.attributes?.LastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || user.attributes.Phone;

    // Auto-fill user data
    logger.info('Setting order data for user', { userId: user.id });
    setOrderData(prev => ({
      ...prev,
      userId: user.id,
      userName: fullName,
      phoneNumber: user.attributes.Phone,
      email: user.attributes.Email || '',
    }));

    // Mark fields as auto-filled
    setFieldStates(prev => ({
      ...prev,
      userName: { isAutoFilled: !!(firstName && lastName), isEditable: false },
      phoneNumber: { isAutoFilled: !!user.attributes.Phone, isEditable: false },
      email: { isAutoFilled: !!user.attributes.Email, isEditable: false },
      address: { isAutoFilled: false, isEditable: true }, // Always editable for new orders
      postalCode: { isAutoFilled: false, isEditable: true },
    }));
  };

  const toggleFieldEdit = (fieldName: keyof typeof fieldStates) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isEditable: !prev[fieldName].isEditable,
      }
    }));
  };

  const submitOrder = async (data: Order) => {
    try {
      logger.info("Creating order", {
        Status: data.orderStatus,
        userId: selectedUser?.id || null,
        hasEmail: !!data.email,
      });

      // Create order
      const orderResponse = await apiClient.post(
        "/orders",
        {
          data: {
            Description: data.description,
            Status: data.orderStatus,
            user: selectedUser?.id || null, // Allow null for manual orders without registered user
            Date: (data.orderDate as any).value || data.orderDate,
            ShippingCost: data.shipping || 0,
            Type: "Manual",
            // Store customer info for manual orders
            CustomerPhone: data.phoneNumber,
            CustomerEmail: data.email || null,
            CustomerName: data.userName || null,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
        },
      );

      logger.info("Order created", { id: (orderResponse as any)?.data?.id });
      const orderId = (orderResponse as any).data.id;

      // Create order items
      logger.info("Creating order items", { count: selectedItems.length });
      const itemPromises = selectedItems.map(item =>
        apiClient.post(
          "/order-items",
          {
            data: {
              Count: item.quantity,
              PerAmount: item.price,
              ProductTitle: item.productName,
              ProductSKU: item.productCode,
              order: orderId,
              product_variation: item.productVariationId || item.productId,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
          }
        )
      );

      await Promise.all(itemPromises);

      // Create contract if needed
      if (data.total > 0) {
        logger.info("Creating contract", { amount: data.total });
        await apiClient.post(
          "/contracts",
          {
            data: {
              Amount: data.total,
              Status: "Not Ready",
              order: orderId,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
          }
        );
      }

      toast.success("سفارش با موفقیت ثبت شد");
      router.push("/super-admin/orders");
    } catch (error: any) {
      logger.error("Order creation error", {
        name: error?.constructor?.name,
        status: error?.response?.status,
        message: error?.message,
      });

      // Check if this is a form validation error
      if (false && error?.message === "2 errors occurred") {
        logger.warn("Form validation error detected");
        toast.error("خطای اعتبارسنجی فرم - لطفا فیلدهای الزامی را بررسی کنید");
        return;
      }

      const errorMessage = error?.response?.data?.error?.message ||
                         error?.response?.data?.message ||
                         error?.message ||
                         "خطایی رخ داده است";

      toast.error(`خطا: ${errorMessage}`);
    }
  };

  const handlePrintReceipt = (e?: React.MouseEvent) => {
    // Prevent form submission if this is triggered from within a form
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (selectedItems.length === 0) {
      toast.error("لطفا ابتدا محصولات را اضافه کنید");
      return;
    }

    // Create a printable receipt
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>رسید پیش‌فاکتور</title>
        <style>
          body { font-family: 'Tahoma', sans-serif; font-size: 12px; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 18px; font-weight: bold; }
          .receipt-title { font-size: 16px; margin: 10px 0; }
          .info-section { margin: 15px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #000; padding: 8px; text-align: center; }
          .items-table th { background-color: #f0f0f0; font-weight: bold; }
          .total-section { margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 14px; }
          .final-total { font-weight: bold; font-size: 16px; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">فروشگاه اینفینیتی</div>
          <div class="receipt-title">پیش‌فاکتور سفارش</div>
          <div>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span>نام مشتری:</span>
            <span>${orderData.userName || '----'}</span>
          </div>
          <div class="info-row">
            <span>شماره تماس:</span>
            <span>${orderData.phoneNumber || '----'}</span>
          </div>
          <div class="info-row">
            <span>ایمیل:</span>
            <span>${orderData.email || '----'}</span>
          </div>
          <div class="info-row">
            <span>آدرس:</span>
            <span>${orderData.address || '----'}</span>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>ردیف</th>
              <th>نام محصول</th>
              <th>کد محصول</th>
              <th>قیمت واحد</th>
              <th>تعداد</th>
              <th>مبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${selectedItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.productName}${item.color ? ` - ${item.color}` : ''}${item.size ? ` - ${item.size}` : ''}</td>
                <td>${item.productCode}</td>
                <td>${new Intl.NumberFormat('fa-IR').format(item.price)} تومان</td>
                <td>${item.quantity}</td>
                <td>${new Intl.NumberFormat('fa-IR').format(item.price * item.quantity)} تومان</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>جمع اقلام:</span>
            <span>${new Intl.NumberFormat('fa-IR').format(orderData.subtotal || 0)} تومان</span>
          </div>
          ${(orderData.discount || 0) > 0 ? `
            <div class="total-row">
              <span>تخفیف:</span>
              <span>${new Intl.NumberFormat('fa-IR').format(orderData.discount || 0)} تومان</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>مالیات:</span>
            <span>${new Intl.NumberFormat('fa-IR').format(orderData.tax || 0)} تومان</span>
          </div>
          ${(orderData.shipping || 0) > 0 ? `
            <div class="total-row">
              <span>هزینه ارسال:</span>
              <span>${new Intl.NumberFormat('fa-IR').format(orderData.shipping || 0)} تومان</span>
            </div>
          ` : ''}
          <div class="total-row final-total">
            <span>مبلغ کل:</span>
            <span>${new Intl.NumberFormat('fa-IR').format(orderData.total || 0)} تومان</span>
          </div>
        </div>

        <div class="footer">
          <p>این پیش‌فاکتور صرفاً جهت اطلاع می‌باشد و ارزش قانونی ندارد</p>
          <p>برای ثبت نهایی سفارش، پیش‌فاکتور را تأیید نمایید</p>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search Sections - Horizontal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Search Section */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-gray-900">انتخاب مشتری</h3>
          <UserSearchSection
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
          />
        </div>

        {/* Product Selection Section */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-gray-900">افزودن محصولات</h3>
          <ProductSelectionSection
            selectedItems={selectedItems}
            onItemsChange={handleItemsChange}
          />
        </div>
      </div>

      {/* Debug Info */}
      {selectedUser && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm">
          <h4 className="font-semibold mb-2">Debug - Order Data:</h4>
          <p>userName: {orderData.userName}</p>
          <p>phoneNumber: {orderData.phoneNumber}</p>
          <p>email: {orderData.email}</p>
          <p>subtotal: {orderData.subtotal}</p>
          <p>total: {orderData.total}</p>
        </div>
      )}


      {/* Order Form */}
      <UpsertPageContentWrapper<Order>
        key={`${selectedUser?.id || 'no-user'}-${selectedItems.length}-${JSON.stringify(fieldStates)}-${orderData.userName}-${orderData.phoneNumber}-${orderData.email}`}
        config={createConfig(fieldStates, toggleFieldEdit)}
        data={orderData as Order}
        onSubmit={async (data) => {
          logger.info("Order form submit", {
            itemsCount: selectedItems.length,
            hasUser: !!selectedUser,
          });

          // Check for incomplete order and show confirmation
          const missingFieldsList = [];
          if (!data.phoneNumber) missingFieldsList.push("شماره تماس");
          if (selectedItems.length === 0) missingFieldsList.push("محصولات");
          if (!data.userName) missingFieldsList.push("نام مشتری");

          if (missingFieldsList.length > 0) {
            setMissingFields(missingFieldsList);
            setPendingSubmitData(data);
            setShowConfirmDialog(true);
            return;
          }

          await submitOrder(data);
        }}
        footer={<Footer order={orderData as Order} onReload={() => {}} />}
        customSidebar={<Sidebar orderData={orderData} selectedItems={selectedItems} />}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="تایید ثبت سفارش"
        description={`فیلدهای زیر خالی هستند: ${missingFields.join(", ")}. آیا مطمئن هستید که می‌خواهید سفارش را ثبت کنید؟`}
        confirmText="ثبت سفارش"
        cancelText="انصراف"
        onConfirm={async () => {
          if (pendingSubmitData) {
            await submitOrder(pendingSubmitData);
          }
          setShowConfirmDialog(false);
          setPendingSubmitData(null);
        }}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingSubmitData(null);
        }}
      />
    </div>
  );
}

