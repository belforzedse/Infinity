# Debugging Mellat Payment Gateway

## Overview

This guide helps you debug issues with the Beh Pardakht Mellat payment gateway integration. The system now includes comprehensive logging and error reporting to help identify problems.

## Quick Test Endpoints

### 1. Test Mellat Gateway Directly

Test the gateway without going through cart finalization:

```bash
curl -X POST 'https://api.infinitycolor.co/api/payment-gateway/test-mellat' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 10000,
    "orderId": 12345
  }'
```

### 2. Run Debug Script Locally

If you have access to the server:

```bash
npm run debug:mellat
```

## Enhanced Error Reporting

### What You'll See in Frontend Response

When a payment fails, you'll now get detailed error information:

```json
{
  "data": null,
  "error": {
    "status": 400,
    "name": "BadRequestError",
    "message": "Request failed with status code 500",
    "details": {
      "data": {
        "success": false,
        "error": "Request failed with status code 500",
        "debug": {
          "requestId": "REQ-1234567890-abc123",
          "type": "MELLAT_REQUEST_ERROR",
          "message": "Request failed with status code 500",
          "code": "ECONNRESET",
          "httpStatus": 500,
          "httpStatusText": "Internal Server Error",
          "responseData": "...",
          "timestamp": "2024-01-15T10:30:00.000Z",
          "debug": {
            "gatewayUrl": "https://bpm.shaparak.ir/pgwchannel/services/pgw",
            "timeout": 30000,
            "hasResponse": true,
            "hasRequest": true,
            "isNetworkError": false,
            "isRequestError": true
          }
        },
        "requestId": "REQ-1234567890-abc123",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "orderId": 42,
        "contractId": 24
      }
    }
  }
}
```

### Server Logs

The server now logs detailed information with request IDs for tracking:

```
[REQ-1234567890-abc123] Mellat Gateway Configuration: {
  terminalId: "732****",
  username: "732****",
  gatewayUrl: "https://bpm.shaparak.ir/pgwchannel/services/pgw",
  usingEnvCredentials: { terminal: false, username: false, password: false }
}

[REQ-1234567890-abc123] Making Mellat payment request: {
  orderId: 42,
  amount: 100000,
  callbackUrl: "https://api.infinitycolor.co/orders/payment-callback",
  userId: 1,
  localDate: "20240115",
  localTime: "103000",
  contractId: 24
}

[REQ-1234567890-abc123] SOAP Request XML: <?xml version="1.0" encoding="utf-8"?>...

[REQ-1234567890-abc123] Sending request to: https://bpm.shaparak.ir/pgwchannel/services/pgw

[REQ-1234567890-abc123] Error in Mellat payment request: {
  message: "Request failed with status code 500",
  code: "ECONNRESET",
  response: { status: 500, data: "..." }
}
```

## Common Issues & Solutions

### 1. HTTP 500 Internal Server Error

**Symptoms:**
- `httpStatus: 500`
- `isRequestError: true`

**Possible Causes:**
1. **Invalid Credentials**: Test credentials not accepted in production
2. **Invalid Request Format**: SOAP XML format issues
3. **Bank Server Issues**: Mellat servers temporarily down

**Solutions:**
```bash
# Check if using test vs production credentials
# Look for this in logs:
usingEnvCredentials: { terminal: false, username: false, password: false }

# If false, you're using hardcoded test credentials
# Set proper environment variables:
MELLAT_TERMINAL_ID=your-real-terminal-id
MELLAT_USERNAME=your-real-username
MELLAT_PASSWORD=your-real-password
```

### 2. Connection Timeout/Reset

**Symptoms:**
- `code: "ECONNRESET"` or `"ETIMEDOUT"`
- `isNetworkError: true`

**Solutions:**
1. Check firewall settings
2. Verify SSL/TLS connectivity
3. Test basic connectivity to `https://bpm.shaparak.ir`

### 3. Invalid Merchant (Error 21)

**Symptoms:**
- RefId contains negative number or error code
- Error code 21 in logs

**Solutions:**
1. Verify terminal ID, username, password with Bank Mellat
2. Ensure merchant account is active
3. Check if you need different credentials for production

### 4. IP Not Whitelisted (Error 421)

**Symptoms:**
- Error code 421 in response
- Valid credentials but connection refused

**Solutions:**
1. Contact Bank Mellat to whitelist server IP
2. Ensure you're using the correct IP address
3. Check if IP changed (dynamic IP issues)

## Debugging Steps

### Step 1: Check Basic Connectivity

Use the test endpoint to verify basic gateway functionality:

```bash
curl -X POST 'https://api.infinitycolor.co/api/payment-gateway/test-mellat' \
  -H 'Content-Type: application/json' \
  -d '{"amount": 10000}'
```

### Step 2: Analyze the Response

Look for these key indicators in the response:

1. **Request ID**: Track specific requests in logs
2. **HTTP Status**: 500 = server error, timeout = network issue
3. **Error Codes**: Specific Mellat error meanings
4. **Debug Info**: Network vs request vs parsing errors

### Step 3: Check Server Logs

Look for log entries with the request ID to see the full flow:

```bash
# If you have server access
grep "REQ-1234567890-abc123" /var/log/your-app.log
```

### Step 4: Verify Configuration

Check if environment variables are properly set:

```javascript
// Look for this in logs:
usingEnvCredentials: { 
  terminal: true,   // Should be true for production
  username: true,   // Should be true for production  
  password: true    // Should be true for production
}
```

## Error Code Reference

| Code | Meaning | Solution |
|------|---------|----------|
| 21 | Invalid merchant | Check credentials with Bank Mellat |
| 25 | Invalid amount | Verify amount format (Rials, min 1000) |
| 34 | System error | Retry or contact Bank Mellat |
| 41 | Duplicate order ID | Use unique order IDs |
| 421 | Invalid IP | Whitelist server IP with Bank Mellat |

## Contact Information

When contacting Bank Mellat support, provide:

1. **Request ID** from error response
2. **Terminal ID** (first 3 digits only for security)
3. **Timestamp** of the failed request
4. **Error code** if available
5. **Server IP address** for whitelisting

## Production Checklist

Before going live:

- [ ] Real merchant credentials configured
- [ ] Server IP whitelisted with Bank Mellat
- [ ] Test transactions successful
- [ ] Error handling tested
- [ ] Monitoring and logging configured
- [ ] SSL certificates valid 