# Payment Cancellation Handling - Mellat Gateway

## Problem You Were Experiencing

When users clicked "Cancel" in the Mellat payment gateway, they received this error:

```
متاسفانه دسترسی شما به این صفحه امکان پذیر نمی باشد.
در صورت تمایل به پرداخت، از طریق یکی از فروشگاه های اینترنتی طرف قرارداد شرکت PSP اقدام نمائید.
```

**Translation:** "Unfortunately, you cannot access this page. If you wish to make a payment, please do so through one of the contracted online stores of PSP company."

## Root Cause Analysis

### **Primary Issue: Incorrect Callback URL**
- We were sending `/orders/payment-callback` instead of `/api/orders/payment-callback`
- Mellat couldn't reach our callback endpoint when users cancelled
- This caused the generic Mellat error page to show

### **Secondary Issue: Poor Cancellation Handling**
- Our callback didn't distinguish between cancellation vs. failure
- No proper order status updates for cancelled payments
- Generic error messages without context

## ✅ **Solution Implemented**

### **1. Fixed Callback URL Format**
```typescript
// Before (incorrect)
const defaultCallback = "/orders/payment-callback";

// After (correct)  
const defaultCallback = "/api/orders/payment-callback";
```

### **2. Enhanced Cancellation Detection**
Now we properly detect and handle user cancellations:

```typescript
if (ResCode === "17") {
  // User cancelled - specific handling
  ctx.redirect(`/payment/cancelled?orderId=${orderId}&reason=user-cancelled`);
} else {
  // Other failures - general error handling  
  ctx.redirect(`/payment/failure?orderId=${orderId}&error=...`);
}
```

### **3. Improved Order Status Management**
- **Cancellation (ResCode 17):** Order status → `"Cancelled"`
- **Other Failures:** Order status → `"Cancelled"`  
- **Success (ResCode 0):** Order status → `"Started"` (Paid)

### **4. Better Logging & Debugging**
Added comprehensive logging for all callback scenarios:

```typescript
strapi.log.info("Payment callback received:", {
  ResCode,
  SaleOrderId, 
  SaleReferenceId,
  RefId,
  OrderId,
  timestamp: new Date().toISOString()
});
```

## **Frontend URL Structure**

Your frontend should handle these redirect URLs:

### **✅ Success Payment**
```
/payment/success?orderId=123
```

### **❌ Failed Payment** 
```
/payment/failure?orderId=123&error=Payment%20failed%20with%20code%3A%2025
```

### **🚫 Cancelled Payment**
```
/payment/cancelled?orderId=123&reason=user-cancelled
```

## **Mellat Response Codes**

| Code | Persian | English | Action |
|------|---------|---------|---------|
| 0 | موفق | Success | Continue to verify & settle |
| 17 | کاربر از انجام تراکنش منصرف شده | User cancelled | Mark order as cancelled |
| 21 | پذیرنده نامعتبر | Invalid merchant | Show error |
| 25 | مبلغ نامعتبر | Invalid amount | Show error |

## **Testing the Fix**

### **1. Test Callback URL**
```bash
npm run test:callback-url
```

### **2. Test Full Payment Flow**
1. Create an order through `/api/cart/finalize-to-order`
2. In Mellat gateway, click "Cancel"
3. Verify you're redirected to `/payment/cancelled` instead of getting the error

### **3. Check Server Logs**
Look for these log entries:
```
Payment callback received: { ResCode: "17", ... }
Payment cancelled by user: { orderId: 123, ResCode: "17" }
Order 123 marked as Cancelled due to payment failure/cancellation
```

## **Production Checklist**

- [ ] Set correct `server.url` in Strapi config
- [ ] Verify callback URL is accessible: `https://your-domain.com/api/orders/payment-callback`
- [ ] Test all three scenarios: success, failure, cancellation
- [ ] Ensure frontend handles all redirect URLs
- [ ] Monitor server logs for proper callback handling

## **Expected Behavior Now**

✅ **User Cancellation:**
1. User clicks "Cancel" in Mellat gateway
2. Mellat calls our callback with `ResCode: "17"`
3. We detect cancellation and redirect to `/payment/cancelled`
4. Order status updated to "Cancelled"
5. User sees your cancellation page, not Mellat's error

✅ **Payment Success:**
1. User completes payment in Mellat gateway  
2. Mellat calls callback with `ResCode: "0"`
3. We verify & settle the transaction
4. Order status updated to "Started" (Paid)
5. User redirected to `/payment/success`

✅ **Payment Failure:**
1. Payment fails in Mellat gateway
2. Mellat calls callback with error code (not 0 or 17)
3. We log the error and redirect to `/payment/failure`
4. Order status updated to "Cancelled"
5. User sees error details 