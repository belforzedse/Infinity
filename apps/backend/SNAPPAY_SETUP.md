# SnappPay Integration Setup Guide

This document explains SnappPay API integration requirements and how to troubleshoot common issues.

## Overview

SnappPay is an installment payment gateway integration that requires:
1. **Merchant Credentials** - Client ID, Client Secret, Username, Password
2. **IP Whitelisting** - Server IP must be registered with SnappPay
3. **Return URL Configuration** - Callback endpoint must match SnappPay merchant registration

## Environment Variables

### Required Configuration

```env
# SnappPay API Gateway
SNAPPAY_BASE_URL=https://api.snapppay.ir                    # Production
SNAPPAY_CLIENT_ID=infinity
SNAPPAY_CLIENT_SECRET=<your-secret>
SNAPPAY_USERNAME=infinity-purchase
SNAPPAY_PASSWORD=<your-password>

# Callback & Frontend URLs
SNAPPAY_RETURN_URL=https://api.infinitycolor.org/api/orders/payment-callback
FRONTEND_BASE_URL=https://infinitycolor.org
```

### Environment-Specific Values

#### Production (main.env)
- API: `https://api.infinitycolor.org/`
- Frontend: `https://infinitycolor.org`
- Return URL: `https://api.infinitycolor.org/api/orders/payment-callback`

#### Staging (dev.env)
- API: `https://api.staging.infinitycolor.org/`
- Frontend: `https://staging.infinitycolor.org`
- Return URL: `https://api.staging.infinitycolor.org/api/orders/payment-callback`

#### Local Development (.env)
- API: `http://localhost:1337/`
- Frontend: `http://localhost:3000`
- Return URL: `http://localhost:1337/api/orders/payment-callback`

## Troubleshooting 403 Errors

If you see a **403 Forbidden** error when calling SnappPay APIs, it's almost always due to one of these issues:

### 1. IP Address Not Whitelisted ⚠️ MOST COMMON

**Error Message:**
```json
{
  "status": 403,
  "statusText": "Forbidden",
  "hint": "IP_NOT_WHITELISTED - Your server IP must be whitelisted by SnappPay"
}
```

**Solution:**
1. Find your server's public IP address:
   ```bash
   # On your production server, run:
   curl ifconfig.me
   ```

2. Contact SnappPay Support with:
   - Your merchant account name: `infinity`
   - Production server public IP (e.g., `123.45.67.89`)
   - Staging server public IP (if applicable)
   - Request: "Please add these IPs to the whitelist for api.snapppay.ir"

3. Wait for SnappPay to confirm the IPs have been whitelisted

### 2. Invalid Credentials

**Error Message:**
```json
{
  "status": 401,
  "statusText": "Unauthorized",
  "errorCode": 1003,
  "hint": "INVALID_CREDENTIALS - Check client_id, client_secret, username, password, or returnURL"
}
```

**Solution:**
- Verify credentials in environment files match SnappPay merchant account
- Check that SNAPPAY_RETURN_URL matches the URL you registered with SnappPay

### 3. Return URL Mismatch

**Error Details from SnappPay:**
> "For the sake of security only requests are acceptable whose returnURL matches with the defined base url that you provided at service register time."

**Solution:**
1. Verify the SNAPPAY_RETURN_URL in your environment matches what you registered:
   ```env
   SNAPPAY_RETURN_URL=https://api.infinitycolor.org/api/orders/payment-callback
   ```

2. If you registered a different URL, either:
   - Update your SnappPay merchant account settings, OR
   - Update the SNAPPAY_RETURN_URL environment variable

## API Implementation

### Key Functions

**src/api/payment-gateway/services/snappay.ts** implements:

- `eligible(amount)` - Check if user qualifies for installment payment
- `requestPaymentToken(payload)` - Request a payment token and redirect URL
- `verify(paymentToken)` - Verify payment after user returns from SnappPay
- `settle(paymentToken)` - Finalize payment (required to charge user)
- `cancel(paymentToken)` - Refund after settlement
- `revert(paymentToken)` - Cancel before settlement
- `status(paymentToken)` - Check payment status
- `update(payload)` - Partial refund for updated cart

### Authentication Flow

1. **Token Request** → `/api/online/v1/oauth/token`
   - Uses Basic Auth (client_id:client_secret)
   - Returns JWT access token (valid 1 hour)
   - Tokens are cached to reduce requests

2. **API Calls** → Use Bearer token in Authorization header
   - All subsequent calls include: `Authorization: Bearer {token}`

## Monitoring & Logging

Enhanced error logging includes IP whitelisting hints:

```
❌ SnappPay token request failed
{
  "context": "requestPaymentToken",
  "status": 403,
  "hint": "IP_NOT_WHITELISTED - Your server IP must be whitelisted by SnappPay",
  "config": {
    "method": "post",
    "url": "/api/online/payment/v1/token",
    "baseURL": "https://api.snapppay.ir"
  },
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

Check application logs for these details when troubleshooting.

## SnappPay Documentation

Full API documentation is available in:
- `SnappPayRestAPIdocumentInstallmentservice_En.html` (in project root)
- `SnappPay Rest API document_ Installment service_En.txt` (text version)

Key sections:
- **Authentication Mechanism** - OAuth token generation
- **Check Merchant Eligibility** - Validate customer eligibility
- **Get Payment Token** - Initiate payment flow
- **Verify / Settle / Revert** - Manage payment status
- **Error Codes** - Complete error reference

## Testing

### Test Endpoints (Production)

```bash
# Test eligible endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://api.infinitycolor.org/api/payment-gateway/snapp-eligible?amount=100000"

# Test token endpoint
curl -X POST https://api.infinitycolor.org/api/payment-gateway/test-snappay \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000}'
```

### Local Development

During local development, SnappPay API calls may fail due to:
1. No IP whitelisting for localhost
2. localhost URLs not matching merchant registration

This is normal. Test with staging environment instead.

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | IP not whitelisted | Contact SnappPay with server IP |
| 401 Unauthorized | Bad credentials | Verify client_id, secret, username, password |
| Invalid returnURL | URL mismatch | Verify SNAPPAY_RETURN_URL env variable |
| Token expired | Token cache issue | Check token expiration logic (should not occur) |
| Payment not settling | Verify not called | Ensure verify() called after user returns |

## Support

For SnappPay-specific issues:
- Contact SnappPay support with merchant name: `infinity`
- Request IP whitelisting updates
- Verify merchant registration URLs match environment configuration

For application-level issues:
- Check logs for error hints
- Review error details in SnappPay service responses
- Verify environment variables are correctly set
