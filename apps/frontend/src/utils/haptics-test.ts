/**
 * Haptic Feedback Test Utility
 * Helper functions to test haptic feedback implementation
 * Use this in development to verify haptic feedback is working
 */

import {
  hapticButton,
  hapticSelection,
  hapticSuccess,
  hapticError,
  hapticWarning,
  hapticNavigation,
  hapticImpact,
  hapticNotification,
  enableHaptics,
  disableHaptics,
  isHapticsEnabled,
} from "./haptics";
import { getDeviceInfo, isHapticSupported } from "./device-detection";

/**
 * Test all haptic types
 * Call this function to test each haptic pattern
 */
export const testAllHaptics = (): void => {
  console.log("🧪 Testing Haptic Feedback");
  console.log("Device Info:", getDeviceInfo());
  console.log("Haptics Supported:", isHapticSupported());
  console.log("Haptics Enabled:", isHapticsEnabled());
  console.log("---");

  const tests = [
    { name: "Button", fn: hapticButton },
    { name: "Selection", fn: hapticSelection },
    { name: "Success", fn: hapticSuccess },
    { name: "Error", fn: hapticError },
    { name: "Warning", fn: hapticWarning },
    { name: "Navigation", fn: hapticNavigation },
    { name: "Impact", fn: hapticImpact },
    { name: "Notification", fn: hapticNotification },
  ];

  tests.forEach((test, index) => {
    setTimeout(() => {
      console.log(`Testing: ${test.name}`);
      test.fn();
    }, index * 500); // Space out tests by 500ms
  });
};

/**
 * Test iOS haptic specifically
 */
export const testIOSHaptics = (): void => {
  const deviceInfo = getDeviceInfo();
  if (!deviceInfo.isIOS) {
    console.warn("⚠️ Not running on iOS device");
    return;
  }

  console.log("🍎 Testing iOS Haptics");
  console.log("Device Info:", deviceInfo);
  testAllHaptics();
};

/**
 * Test Android haptic specifically
 */
export const testAndroidHaptics = (): void => {
  const deviceInfo = getDeviceInfo();
  if (!deviceInfo.isAndroid) {
    console.warn("⚠️ Not running on Android device");
    return;
  }

  console.log("🤖 Testing Android Haptics");
  console.log("Device Info:", deviceInfo);
  testAllHaptics();
};

/**
 * Test user preferences
 */
export const testHapticsPreferences = (): void => {
  console.log("⚙️ Testing Haptics Preferences");
  console.log("Initial state:", isHapticsEnabled());

  console.log("Disabling haptics...");
  disableHaptics();
  console.log("After disable:", isHapticsEnabled());
  hapticButton(); // Should not trigger

  console.log("Enabling haptics...");
  enableHaptics();
  console.log("After enable:", isHapticsEnabled());
  hapticButton(); // Should trigger
};

/**
 * Get haptic system status
 */
export const getHapticsStatus = (): {
  deviceInfo: ReturnType<typeof getDeviceInfo>;
  supported: boolean;
  enabled: boolean;
  preference: boolean | null;
} => {
  const deviceInfo = getDeviceInfo();
  const supported = isHapticSupported();
  const enabled = isHapticsEnabled();

  let preference: boolean | null = null;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("haptics-enabled");
      preference = stored === null ? null : stored === "true";
    } catch {
      // Ignore
    }
  }

  return {
    deviceInfo,
    supported,
    enabled,
    preference,
  };
};

/**
 * Log haptic system status to console
 */
export const logHapticsStatus = (): void => {
  const status = getHapticsStatus();
  console.log("📊 Haptic Feedback Status:", status);
};


