# PWA Install Prompt Troubleshooting

## Why the Install Prompt Might Not Appear

The PWA install prompt only appears when the browser fires the `beforeinstallprompt` event. This event has specific requirements:

### Requirements for Install Prompt

1. **HTTPS Required** (or localhost for development)
   - ✅ Production: Must be served over HTTPS
   - ✅ Development: Works on `localhost` or `127.0.0.1`
   - ❌ HTTP: Won't work on regular HTTP (except localhost)

2. **Valid Manifest**
   - ✅ Manifest.json must be accessible
   - ✅ All required fields must be present
   - ✅ Icons must be valid and accessible

3. **Service Worker Registered**
   - ✅ Service worker must be registered and active
   - ✅ Must be served from same origin

4. **Browser Support**
   - ✅ Chrome/Edge (Desktop & Mobile)
   - ✅ Firefox (Desktop)
   - ✅ Samsung Internet
   - ❌ Safari iOS (doesn't support `beforeinstallprompt` event)
   - ⚠️ Safari macOS (limited support)

5. **User Engagement**
   - Browsers may require user interaction before showing prompt
   - Some browsers wait until user has visited site multiple times

6. **Not Already Installed**
   - If app is already installed, prompt won't show
   - If user previously dismissed, may not show again

## How to Test

### 1. Check Browser Console
Open DevTools (F12) and look for:
```
[PWA] beforeinstallprompt event fired!
```

### 2. Check Service Worker
- DevTools → Application → Service Workers
- Should show "activated and running"

### 3. Check Manifest
- DevTools → Application → Manifest
- Should show all manifest details without errors

### 4. Check Installability
- DevTools → Application → Manifest
- Look for "Add to homescreen" or install button in address bar

### 5. Test on Different Browsers
- **Chrome/Edge**: Full support
- **Firefox**: Good support
- **Safari iOS**: No `beforeinstallprompt` event (users must use Share → Add to Home Screen)

## Manual Installation Instructions

If the prompt doesn't appear, users can install manually:

### Chrome/Edge (Desktop)
1. Look for install icon (+) in address bar
2. Click it to install

### Chrome/Edge (Mobile)
1. Tap menu (⋮)
2. Select "Install app" or "Add to Home screen"

### Firefox (Desktop)
1. Tap menu (☰)
2. Select "Install"

### Safari iOS
1. Tap Share button
2. Scroll down and tap "Add to Home Screen"

## Debugging Steps

1. **Check if running on HTTPS/localhost**
   ```javascript
   console.log(window.location.protocol); // Should be "https:" or "http:" (localhost)
   ```

2. **Check if service worker is registered**
   ```javascript
   navigator.serviceWorker.getRegistration().then(reg => console.log(reg));
   ```

3. **Check if manifest is accessible**
   - Open `/manifest.json` in browser
   - Should show JSON, not 404

4. **Check browser console for errors**
   - Look for any PWA-related errors
   - Check for service worker registration errors

5. **Clear browser data and retry**
   - Clear cache and cookies
   - Unregister service worker
   - Reload page

## Common Issues

### Issue: Prompt doesn't appear on first visit
**Solution**: Browsers often wait for user engagement. Try:
- Interacting with the page (clicking, scrolling)
- Visiting the site multiple times
- Waiting a few seconds

### Issue: Prompt doesn't appear on HTTP
**Solution**: PWA requires HTTPS (except localhost). Deploy to HTTPS or use localhost for testing.

### Issue: Prompt doesn't appear on Safari iOS
**Solution**: Safari iOS doesn't support `beforeinstallprompt`. Users must use Share → Add to Home Screen manually.

### Issue: Prompt appeared once, then never again
**Solution**: User may have dismissed it. Clear `sessionStorage` and `localStorage`:
```javascript
sessionStorage.removeItem("pwa-prompt-dismissed");
localStorage.removeItem("pwa-installed");
```

## Testing Checklist

- [ ] Running on HTTPS or localhost
- [ ] Service worker registered and active
- [ ] Manifest.json accessible and valid
- [ ] Icons are accessible (no 404 errors)
- [ ] Browser supports PWA (Chrome/Edge/Firefox)
- [ ] Not already installed
- [ ] User has interacted with page
- [ ] Check browser console for errors
- [ ] Check DevTools → Application → Manifest for errors

