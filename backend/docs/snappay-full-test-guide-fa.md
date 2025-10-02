# راهنمای کامل تست SnappPay

این راهنما برای انجام تست‌های کامل درخواستی تیم SnappPay است.

## 📋 خلاصه سناریوهای تست

### **سناریو 1: خرید تست (اصلی)**
یک سبد خرید با مشخصات زیر بسازید:
- یک محصول **با تخفیف**
- دو عدد از یک محصول **بدون تخفیف**
- هزینه ارسال
- کد تخفیف یا کیف پول
- **مبلغ نهایی: 4,000 تا 10,000 تومان**

### **سناریو 2: Update**
یک آیتم از سبد خرید را مرجوع کنید → متد `update` را با سبد باقی‌مانده فراخوانی کنید

### **سناریو 3: Cancel**
کل سبد خرید را کنسل کنید → متد `cancel` را فراخوانی کنید

---

## 📝 آماده‌سازی سبد خرید تست

### مرحله 1: ایجاد محصولات

در پنل ادمین Strapi:

**محصول 1 (با تخفیف):**
- عنوان: "تی‌شرت مشکی"
- قیمت اصلی: 5,000 تومان
- قیمت با تخفیف: 3,000 تومان
- موجودی: 10 عدد

**محصول 2 (بدون تخفیف):**
- عنوان: "جوراب سفید"
- قیمت: 1,500 تومان
- موجودی: 20 عدد

### مرحله 2: ایجاد کد تخفیف

در پنل ادمین:
- کد: `TESTSNAPP`
- مقدار: 1,000 تومان یا 10٪
- فعال: بله

### مرحله 3: محاسبه مبلغ نهایی

```
محصول 1 (با تخفیف): 3,000 تومان × 1 = 3,000 تومان
محصول 2 (بدون تخفیف): 1,500 تومان × 2 = 3,000 تومان
جمع: 6,000 تومان

مالیات (10٪): 600 تومان
هزینه ارسال: 0 تومان (یا کم‌ترین مقدار)
کد تخفیف: -1,000 تومان

مبلغ نهایی: 5,600 تومان ✅ (بین 4,000 تا 10,000)
```

---

## 🛒 سناریو 1: خرید تست

### مرحله 1: افزودن به سبد خرید

از فرانت‌اند یا Postman:

```bash
# افزودن محصول 1 (با تخفیف)
POST https://api.infinitycolor.co/api/carts
{
  "product_variation": 1,  # ID variation محصول با تخفیف
  "Count": 1
}

# افزودن محصول 2 (بدون تخفیف) - 2 عدد
POST https://api.infinitycolor.co/api/carts
{
  "product_variation": 2,  # ID variation محصول بدون تخفیف
  "Count": 2
}
```

### مرحله 2: تسویه حساب (Checkout)

```bash
POST https://api.infinitycolor.co/api/carts/finalize-to-order
{
  "shipping": 1,  # ID shipping method
  "discountCode": "TESTSNAPP",
  "gateway": "snappay"
}
```

**نتیجه:**
- `paymentPageUrl` دریافت می‌کنید
- به صفحه پرداخت SnappPay هدایت شوید

### مرحله 3: تکمیل پرداخت

1. اطلاعات کارت تست SnappPay را وارد کنید
2. پرداخت را تکمیل کنید
3. به صفحه موفقیت هدایت می‌شوید

### مرحله 4: جمع‌آوری اطلاعات

**از دیتابیس:**
```sql
SELECT
  ct.TrackId as payment_token,
  ct.external_id as transaction_id,
  o.id as order_id,
  c.Amount as contract_amount
FROM contract_transactions ct
JOIN contracts c ON ct.contract_id = c.id
JOIN orders o ON c.order_id = o.id
WHERE ct.external_source = 'SnappPay'
ORDER BY ct.createdAt DESC
LIMIT 1;
```

**از صفحه موفقیت:**
- Screenshot از صفحه که شامل:
  - لیست محصولات
  - قیمت‌ها (با تخفیف/بدون تخفیف)
  - هزینه ارسال
  - کد تخفیف
  - مبلغ نهایی
  - Transaction ID

**موارد ارسالی به تیم SnappPay:**
```
Payment Token: snp_pay_xxxxx
Transaction ID: O12345ABC
مبلغ نهایی: 5,600 تومان
Screenshot: checkout-success.png
```

---

## 🔄 سناریو 2: Update (مرجوع بخشی از سبد)

**زمان استفاده:** وقتی یک آیتم از سفارش مرجوع می‌شود

### مرحله 1: پیدا کردن Payment Token

از سناریو 1 یا از دیتابیس:
```sql
SELECT TrackId, external_id
FROM contract_transactions
WHERE external_source = 'SnappPay'
  AND Status = 'Settled'
ORDER BY createdAt DESC
LIMIT 1;
```

### مرحله 2: ساخت سبد باقی‌مانده

فرض کنید محصول 1 (تی‌شرت) مرجوع شد، فقط 2 عدد جوراب باقی مانده:

```javascript
{
  "paymentToken": "snp_pay_xxxxx",
  "updatedCart": {
    "amount": 15000,  // 1,500 IRR (فقط جوراب‌ها)
    "discountAmount": 0,
    "externalSourceAmount": 0,
    "mobile": "+989121234567",
    "paymentMethodTypeDto": "INSTALLMENT",
    "returnURL": "https://api.infinitycolor.co/api/orders/payment-callback",
    "transactionId": "U12345ABC",
    "cartList": [{
      "cartId": 123,
      "cartItems": [{
        "amount": 15000,  // قیمت هر عدد جوراب
        "category": "پوشاک",
        "count": 2,
        "id": 2,
        "name": "جوراب سفید",
        "commissionType": 100
      }],
      "isShipmentIncluded": true,
      "isTaxIncluded": true,
      "shippingAmount": 0,
      "taxAmount": 1500,  // 10٪ از 15,000
      "totalAmount": 16500  // 15,000 + 1,500
    }]
  }
}
```

### مرحله 3: ارسال درخواست Update

**روش 1: از سرور**
```bash
curl -X POST https://api.infinitycolor.co/api/payment-gateway/test-snappay-update \
  -H "Content-Type: application/json" \
  -d @update-request.json
```

**روش 2: Postman**
```
POST https://api.infinitycolor.co/api/payment-gateway/test-snappay-update
Body: (JSON بالا)
```

### مرحله 4: جمع‌آوری نتایج

**موارد ارسالی به SnappPay:**
```
Payment Token: snp_pay_xxxxx
Transaction ID (اصلی): O12345ABC
Transaction ID (update): U12345ABC
مبلغ قبل از update: 5,600 تومان
مبلغ بعد از update: 1,650 تومان (فقط جوراب‌ها)
Screenshot: update-result.png
```

---

## ❌ سناریو 3: Cancel (مرجوع کل سبد)

**زمان استفاده:** وقتی کل سفارش کنسل می‌شود

### مرحله 1: پیدا کردن Payment Token

مثل سناریو 2

### مرحله 2: ارسال درخواست Cancel

```bash
# روش 1: Script
node scripts/test-snappay-cancel.js "snp_pay_xxxxx"

# روش 2: curl
curl -X POST https://api.infinitycolor.co/api/payment-gateway/test-snappay-cancel \
  -H "Content-Type: application/json" \
  -d '{"paymentToken": "snp_pay_xxxxx"}'

# روش 3: Postman
POST https://api.infinitycolor.co/api/payment-gateway/test-snappay-cancel
Body: {"paymentToken": "snp_pay_xxxxx"}
```

### مرحله 3: بررسی نتیجه

```json
{
  "data": {
    "success": true,
    "result": {
      "successful": true,
      "response": {
        "status": "CANCELLED",
        "transactionId": "O12345ABC"
      }
    }
  }
}
```

### مرحله 4: جمع‌آوری نتایج

**موارد ارسالی به SnappPay:**
```
Payment Token: snp_pay_xxxxx
Transaction ID: O12345ABC
وضعیت قبل: SETTLED
وضعیت بعد: CANCELLED
Screenshot: cancel-result.png
```

---

## 📊 چک‌لیست کامل ارسالی به SnappPay

برای **سناریو 1 (خرید اصلی):**
- [ ] Payment Token
- [ ] Transaction ID
- [ ] Screenshot صفحه checkout شامل:
  - [ ] محصول با تخفیف (1 عدد)
  - [ ] محصول بدون تخفیف (2 عدد)
  - [ ] قیمت‌های محصولات
  - [ ] هزینه ارسال
  - [ ] کد تخفیف اعمال شده
  - [ ] مبلغ نهایی (4,000-10,000 تومان)

برای **سناریو 2 (Update):**
- [ ] Payment Token
- [ ] Transaction ID اصلی
- [ ] Transaction ID جدید (بعد از update)
- [ ] مبلغ قبل و بعد از update
- [ ] Screenshot نتیجه API
- [ ] لیست محصولات باقی‌مانده

برای **سناریو 3 (Cancel):**
- [ ] Payment Token
- [ ] Transaction ID
- [ ] Screenshot نتیجه API
- [ ] تایید تغییر وضعیت به CANCELLED

---

## 🔍 نکات مهم

### محاسبه مبلغ نهایی
همیشه مبلغ را به **ریال (IRR)** ارسال کنید:
```javascript
مبلغ تومان × 10 = مبلغ ریال
5,600 تومان × 10 = 56,000 ریال
```

### Category به فارسی
مطمئن شوید `category` به فارسی ارسال می‌شود:
```javascript
// ✅ درست
category: "پوشاک"

// ❌ غلط
category: "Clothing"
```

### Commission Type
همیشه `commissionType: 100` ارسال شود

### Update فقط کاهش
در سناریو Update، فقط می‌توانید مبلغ را **کاهش** دهید، نه افزایش

### Test Environment
محیط تست است، اما پرداخت واقعی انجام می‌شود و بازگشت داده نمی‌شود

---

## 🛠️ Troubleshooting

### خطا: "Cannot update - amount increased"
Update فقط برای کاهش مبلغ است. مبلغ جدید باید کمتر از مبلغ اصلی باشد.

### خطا: "Transaction not settled"
Cancel و Update فقط برای تراکنش‌های Settled کار می‌کنند. ابتدا پرداخت را کامل کنید.

### خطا: "Invalid payment token"
Token منقضی شده یا اشتباه است. از دیتابیس token جدیدی بگیرید.

---

## 📞 پشتیبانی

در صورت بروز مشکل:
1. لاگ‌های سرور را چک کنید: `pm2 logs`
2. Status transaction را بررسی کنید
3. با تیم پشتیبانی SnappPay تماس بگیرید
