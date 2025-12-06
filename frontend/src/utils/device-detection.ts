/**
 * Device Detection Utility
 * Detects device type, platform, browser capabilities, and PWA mode
 * Results are cached for performance
 */

interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isStandalone: boolean;
  supportsVibration: boolean;
  supportsIOSHaptics: boolean;
  browser: string;
  platform: string;
}

let cachedDeviceInfo: DeviceInfo | null = null;

/**
 * Detect if device is iOS
 */
const detectIOS = (): boolean => {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;
  const platform = navigator.platform;

  // Check for iPhone, iPad, iPod
  if (/iPad|iPhone|iPod/.test(ua)) return true;

  // Check for iPad on iOS 13+ (reports as MacIntel)
  if (platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;

  return false;
};

/**
 * Detect if device is Android
 */
const detectAndroid = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android/.test(navigator.userAgent);
};

/**
 * Detect if device is mobile (iOS or Android)
 */
const detectMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return detectIOS() || detectAndroid() ||
         /Mobile|Tablet/.test(navigator.userAgent) ||
         (window.innerWidth <= 768 && "ontouchstart" in window);
};

/**
 * Detect if app is running in standalone PWA mode
 */
const detectStandalone = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check display-mode media query (most reliable)
  if (window.matchMedia("(display-mode: standalone)").matches) return true;

  // Fallback checks
  if ((window.navigator as any).standalone === true) return true; // iOS Safari
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;

  return false;
};

/**
 * Detect if browser supports Vibration API
 */
const detectVibrationSupport = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return "vibrate" in navigator || "vibrate" in (window.navigator as any);
};

/**
 * Detect browser name
 */
const detectBrowser = (): string => {
  if (typeof window === "undefined") return "unknown";

  const ua = navigator.userAgent;

  if (ua.includes("Chrome") && !ua.includes("Edg")) return "chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "safari";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Edg")) return "edge";
  if (ua.includes("Opera") || ua.includes("OPR")) return "opera";

  return "unknown";
};

/**
 * Get platform name
 */
const getPlatform = (): string => {
  if (typeof window === "undefined") return "unknown";

  if (detectIOS()) return "ios";
  if (detectAndroid()) return "android";
  if (/Windows/.test(navigator.platform)) return "windows";
  if (/Mac/.test(navigator.platform)) return "macos";
  if (/Linux/.test(navigator.platform)) return "linux";

  return "unknown";
};

/**
 * Get comprehensive device information
 * Results are cached for performance
 */
export const getDeviceInfo = (): DeviceInfo => {
  // Return cached result if available
  if (cachedDeviceInfo) return cachedDeviceInfo;

  const isIOS = detectIOS();
  const isAndroid = detectAndroid();
  const isMobile = detectMobile();
  const isStandalone = detectStandalone();
  const supportsVibration = detectVibrationSupport();

  const deviceInfo: DeviceInfo = {
    isIOS,
    isAndroid,
    isMobile,
    isDesktop: !isMobile,
    isStandalone,
    supportsVibration,
    supportsIOSHaptics: isIOS, // iOS supports haptics via checkbox workaround
    browser: detectBrowser(),
    platform: getPlatform(),
  };

  // Cache the result
  cachedDeviceInfo = deviceInfo;

  return deviceInfo;
};

/**
 * Clear cached device info (useful for testing or when device capabilities change)
 */
export const clearDeviceInfoCache = (): void => {
  cachedDeviceInfo = null;
};

/**
 * Check if haptic feedback is supported on this device
 */
export const isHapticSupported = (): boolean => {
  const deviceInfo = getDeviceInfo();
  return deviceInfo.supportsVibration || deviceInfo.supportsIOSHaptics;
};

/**
 * Check if device prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/**
 * Get user preference for haptics from localStorage
 */
export const getHapticsPreference = (): boolean | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("haptics-enabled");
    if (stored === null) return null;
    return stored === "true";
  } catch {
    return null;
  }
};

/**
 * Set user preference for haptics in localStorage
 */
export const setHapticsPreference = (enabled: boolean): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("haptics-enabled", enabled.toString());
    // Clear device cache in case preference affects behavior
    clearDeviceInfoCache();
  } catch (error) {
    console.debug("[Device Detection] Failed to save haptics preference:", error);
  }
};


