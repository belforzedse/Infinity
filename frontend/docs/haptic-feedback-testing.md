# Haptic Feedback Testing Guide

## Overview

The enhanced haptic feedback system supports:
- **iOS**: Via hidden checkbox workaround (works in iOS Safari, including iOS 18)
- **Android**: Via Vibration API
- **Desktop**: Graceful fallback (no haptics, no errors)

## Quick Test

### In Browser Console

```javascript
// Import test utilities (in development)
import { testAllHaptics, logHapticsStatus } from '@/utils/haptics-test';

// Check system status
logHapticsStatus();

// Test all haptic types
testAllHaptics();
```

### Manual Testing

1. **Open browser console** (F12 or Cmd+Option+I)
2. **Check device detection:**
   ```javascript
   import { getDeviceInfo } from '@/utils/device-detection';
   console.log(getDeviceInfo());
   ```
3. **Test individual haptics:**
   ```javascript
   import { hapticButton, hapticSuccess, hapticError } from '@/utils/haptics';
   hapticButton();    // Light tap
   hapticSuccess();   // Success pattern
   hapticError();      // Error pattern
   ```

## iOS Testing (iOS 18)

### Requirements
- iOS device (iPhone/iPad)
- iOS 18 Safari browser
- Or PWA installed in standalone mode

### Test Steps

1. **Open app in Safari** (not Chrome on iOS - Chrome on iOS uses Safari engine)
2. **Test in regular Safari:**
   - Navigate to any page
   - Click buttons (should feel light haptic)
   - Navigate/swipe (should feel medium haptic)
   - Add to cart (should feel success haptic)
   - Trigger errors (should feel error haptic)

3. **Test in PWA standalone mode:**
   - Install PWA to home screen
   - Open from home screen
   - Repeat tests above
   - Haptics should work the same

4. **Test with reduced motion:**
   - Settings → Accessibility → Motion → Reduce Motion (ON)
   - Haptics should be disabled automatically
   - Verify no haptics trigger

5. **Test user preference:**
   ```javascript
   import { disableHaptics, enableHaptics } from '@/utils/haptics';
   disableHaptics(); // Should stop all haptics
   enableHaptics();  // Should re-enable haptics
   ```

### Expected Behavior

- ✅ Light haptic on button clicks
- ✅ Medium haptic on navigation/swiping
- ✅ Success pattern on successful actions (add to cart, etc.)
- ✅ Error pattern on errors
- ✅ No haptics when disabled or reduced motion is on
- ✅ No console errors

## Android Testing

### Requirements
- Android device
- Chrome or other Chromium-based browser
- Vibration API support

### Test Steps

1. **Open app in Chrome**
2. **Test all haptic types:**
   - Button clicks (light vibration)
   - Navigation (medium vibration)
   - Success (pattern: short-long-short)
   - Error (pattern: triple strong)
   - Warning (pattern: double tap)

3. **Test in PWA mode:**
   - Install PWA
   - Test in standalone mode
   - Should work the same

4. **Test user preferences:**
   - Same as iOS testing

### Expected Behavior

- ✅ Vibration patterns match expected types
- ✅ Patterns are distinct and recognizable
- ✅ No excessive vibrations (debouncing works)
- ✅ Navigation haptics are throttled (not too frequent)

## User Preference Testing

### Test Cases

1. **Default State:**
   - No preference set → Haptics should be enabled
   - Verify haptics work

2. **Disable Haptics:**
   ```javascript
   import { disableHaptics } from '@/utils/haptics';
   disableHaptics();
   ```
   - Haptics should stop immediately
   - Preference should persist after page reload

3. **Enable Haptics:**
   ```javascript
   import { enableHaptics } from '@/utils/haptics';
   enableHaptics();
   ```
   - Haptics should work again
   - Preference should persist after page reload

4. **Reduced Motion:**
   - Enable "Reduce Motion" in system settings
   - Haptics should be automatically disabled
   - Works on both iOS and Android

## Performance Testing

### Debouncing Test

Rapidly click a button multiple times:
```javascript
// Should only trigger haptic once per 50ms
for (let i = 0; i < 10; i++) {
  hapticButton();
}
```

### Throttling Test

Rapidly trigger navigation:
```javascript
// Should only trigger haptic once per 200ms
for (let i = 0; i < 10; i++) {
  hapticNavigation();
}
```

### Queue Test

Trigger multiple different haptics rapidly:
- Should queue up to 3 haptics
- Should process them with minimum 30ms intervals
- Should not cause errors or performance issues

## Common Issues

### iOS: No Haptics

**Possible causes:**
1. Not using Safari (Chrome on iOS doesn't support checkbox trick)
2. Reduced motion is enabled
3. Haptics are disabled in user preferences
4. Device is in low power mode (iOS may disable haptics)

**Solutions:**
- Use Safari browser
- Check system settings
- Check user preferences
- Check device battery/power mode

### Android: No Vibration

**Possible causes:**
1. Vibration API not supported
2. Device vibration is disabled in system settings
3. App doesn't have vibration permission (shouldn't be needed for web)

**Solutions:**
- Check device settings → Sound & Vibration
- Verify browser supports Vibration API
- Check console for errors

### Too Many Haptics

**Possible causes:**
1. Debouncing/throttling not working
2. Queue is overflowing

**Solutions:**
- Check console for errors
- Verify timing constants are correct
- Check if multiple components are triggering haptics

## Debugging

### Enable Debug Logging

Add to `haptics.ts` temporarily:
```typescript
console.debug("[Haptics] Triggering:", type, options);
```

### Check Device Info

```javascript
import { getDeviceInfo } from '@/utils/device-detection';
console.log(getDeviceInfo());
```

### Check Haptic Status

```javascript
import { getHapticsStatus } from '@/utils/haptics-test';
console.log(getHapticsStatus());
```

## Test Checklist

### iOS Testing
- [ ] Test in Safari (regular mode)
- [ ] Test in PWA standalone mode
- [ ] Test with reduced motion enabled
- [ ] Test user preference disable/enable
- [ ] Test all haptic types
- [ ] Verify no console errors

### Android Testing
- [ ] Test in Chrome
- [ ] Test in PWA standalone mode
- [ ] Test with reduced motion enabled
- [ ] Test user preference disable/enable
- [ ] Test all haptic types
- [ ] Verify vibration patterns are correct
- [ ] Verify debouncing/throttling works

### Desktop Testing
- [ ] Verify graceful fallback (no errors)
- [ ] Verify no performance impact
- [ ] Verify user preferences work

### Cross-Platform
- [ ] Verify preferences persist across sessions
- [ ] Verify reduced motion is respected
- [ ] Verify no memory leaks (iOS checkbox cleanup)
- [ ] Verify performance is acceptable

