# Mellat Payment Gateway Configuration

## Environment Variables

Add these environment variables to your `.env` file to configure the Mellat payment gateway:

```bash
# Mellat Payment Gateway (Beh Pardakht)
MELLAT_TERMINAL_ID=your-terminal-id-from-bank
MELLAT_USERNAME=your-username-from-bank  
MELLAT_PASSWORD=your-password-from-bank
MELLAT_GATEWAY_URL=https://bpm.shaparak.ir/pgwchannel/services/pgw
```

## Getting Production Credentials

1. **Contact Bank Mellat**: Reach out to Bank Mellat's merchant services
2. **Apply for Merchant Account**: Submit required business documents
3. **Get Terminal Information**: Bank will provide:
   - Terminal ID
   - Username 
   - Password
   - IP Whitelisting requirements

## Testing the Configuration

Run the debug script to test your Mellat configuration:

```bash
npm run debug:mellat
```

This will test:
- ✅ Basic connectivity to Bank Mellat
- ✅ SOAP endpoint accessibility  
- ✅ Authentication and request format
- ✅ Error code analysis

## Common Issues

### 1. Invalid Credentials (Error 21)
- **Problem**: `پذیرنده نامعتبر است` (Invalid merchant)
- **Solution**: Verify your terminal ID, username, and password with Bank Mellat

### 2. IP Not Whitelisted (Error 421)  
- **Problem**: `IP نامعتبر است` (Invalid IP)
- **Solution**: Contact Bank Mellat to whitelist your server's IP address

### 3. Invalid Amount (Error 25)
- **Problem**: `مبلغ نامعتبر است` (Invalid amount)
- **Solution**: Ensure amount is in Rials (not Tomans) and minimum 1000 Rials

### 4. Network/SSL Issues
- **Problem**: Connection timeout or SSL errors
- **Solution**: Check firewall settings and ensure HTTPS connectivity

## Development vs Production

### Development/Testing
Use the provided test credentials for development:
```bash
MELLAT_TERMINAL_ID=MELLAT_TERMINAL_ID
MELLAT_USERNAME=MELLAT_TERMINAL_ID
MELLAT_PASSWORD=MELLAT_PASSWORD
```

### Production  
Use your actual merchant credentials provided by Bank Mellat:
```bash
MELLAT_TERMINAL_ID=your-real-terminal-id
MELLAT_USERNAME=your-real-username
MELLAT_PASSWORD=your-real-password
```

## Error Codes Reference

| Code | Persian Message | English Meaning |
|------|-----------------|-----------------|
| 11 | شماره کارت نامعتبر است | Invalid card number |
| 12 | موجودی کافی نیست | Insufficient balance |
| 21 | پذیرنده نامعتبر است | Invalid merchant |
| 25 | مبلغ نامعتبر است | Invalid amount |
| 34 | خطای سیستمی | System error |
| 41 | شماره درخواست تکراری است | Duplicate order ID |
| 421 | IP نامعتبر است | Invalid IP address |

## Support

If you encounter persistent issues:

1. **Check Logs**: Look at server logs for detailed error messages
2. **Run Debug Script**: Use `npm run debug:mellat` for diagnostics
3. **Contact Bank Mellat**: Reach out to their technical support
4. **Verify Configuration**: Double-check all environment variables 