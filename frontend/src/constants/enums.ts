enum OrderStatus {
  Pending = "PENDING",
  Processing = "PROCESSING",
  Shipped = "SHIPPED",
  Delivered = "DELIVERED",
  Cancelled = "CANCELLED",
}

enum PersianOrderStatus {
  INPROGRESS = "جاری",
  DELIVERED = "تحویل داده شده",
  CANCELLED = "لغو شده",
}

enum PaymentMethod {
  CreditCard = "CREDIT_CARD",
  BankTransfer = "BANK_TRANSFER",
  Cash = "CASH_ON_DELIVERY",
}

export { OrderStatus, PaymentMethod, PersianOrderStatus };
