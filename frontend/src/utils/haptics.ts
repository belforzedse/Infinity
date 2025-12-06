/**
 * Enhanced Haptic Feedback Utility
 * Provides native-like haptic feedback for mobile interactions
 * Supports iOS (via checkbox workaround), Android (via Vibration API), and graceful fallback
 *
 * Features:
 * - iOS support via hidden checkbox trick
 * - Android support via Vibration API
 * - User preference management
 * - Debouncing and throttling
 * - Respects reduced motion preferences
 * - Enhanced haptic patterns
 */

import { triggerIOSHaptic, isIOSHapticSupported } from "./haptics-ios";
import {
  getDeviceInfo,
  isHapticSupported,
  prefersReducedMotion,
  getHapticsPreference,
} from "./device-detection";

export type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection" | "impact" | "notification";

// Debounce and throttle tracking
let lastHapticTime = 0;
let hapticQueue: Array<() => void> = [];
let isProcessingQueue = false;
const MAX_QUEUE_SIZE = 3;

// Timing constants
const DEBOUNCE_DELAY = 50; // ms - for rapid button clicks
const THROTTLE_DELAY = 200; // ms - for navigation haptics
const MIN_HAPTIC_INTERVAL = 30; // ms - minimum time between haptics

/**
 * Check if haptic feedback should be triggered
 * Considers user preferences, reduced motion, and device support
 */
const shouldTriggerHaptic = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check user preference
  const preference = getHapticsPreference();
  if (preference === false) return false; // Explicitly disabled

  // Respect reduced motion preference
  if (prefersReducedMotion()) return false;

  // Check device support
  return isHapticSupported();
};

/**
 * Vibration API patterns for Android/desktop
 * Enhanced patterns based on UX best practices
 */
const getVibrationPattern = (type: HapticType): number | number[] => {
  const patterns: Record<HapticType, number | number[]> = {
    // Light feedback - single short pulse
    light: 10,
    selection: 10,

    // Medium feedback - slightly longer pulse
    medium: 20,
    impact: 20,

    // Heavy feedback - strong pulse
    heavy: 30,

    // Success - short-long-short pattern (positive confirmation)
    success: [10, 50, 10],
    notification: [10, 50, 10],

    // Warning - double medium pulse (attention needed)
    warning: [20, 30, 20],

    // Error - triple strong pulse (error occurred)
    error: [30, 50, 30, 50, 30],
  };

  return patterns[type] || patterns.light;
};

/**
 * Trigger vibration via Vibration API (Android/desktop)
 */
const triggerVibration = (pattern: number | number[]): void => {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration is not supported
    console.debug("[Haptics] Vibration API failed:", error);
  }
};

/**
 * Process haptic queue
 */
const processHapticQueue = (): void => {
  if (isProcessingQueue || hapticQueue.length === 0) return;

  isProcessingQueue = true;
  const hapticFn = hapticQueue.shift();

  if (hapticFn) {
    hapticFn();
  }

  // Continue processing queue after a short delay
  setTimeout(() => {
    isProcessingQueue = false;
    if (hapticQueue.length > 0) {
      processHapticQueue();
    }
  }, MIN_HAPTIC_INTERVAL);
};

/**
 * Add haptic to queue (with size limit)
 */
const queueHaptic = (hapticFn: () => void): void => {
  if (hapticQueue.length >= MAX_QUEUE_SIZE) {
    // Remove oldest if queue is full
    hapticQueue.shift();
  }
  hapticQueue.push(hapticFn);
  processHapticQueue();
};

/**
 * Core haptic trigger function
 * Handles iOS vs Android, debouncing, throttling, and queueing
 */
const triggerHapticCore = (
  type: HapticType,
  options: { debounce?: boolean; throttle?: boolean } = {}
): void => {
  if (!shouldTriggerHaptic()) return;

  const now = Date.now();
  const timeSinceLastHaptic = now - lastHapticTime;

  // Debounce: prevent rapid successive haptics
  if (options.debounce && timeSinceLastHaptic < DEBOUNCE_DELAY) {
    return;
  }

  // Throttle: limit frequency of haptics
  if (options.throttle && timeSinceLastHaptic < THROTTLE_DELAY) {
    return;
  }

  // Minimum interval: prevent too-rapid haptics
  if (timeSinceLastHaptic < MIN_HAPTIC_INTERVAL) {
    queueHaptic(() => triggerHapticCore(type, { ...options, debounce: false, throttle: false }));
    return;
  }

  lastHapticTime = now;

  const deviceInfo = getDeviceInfo();

  // Use iOS haptics if on iOS
  if (deviceInfo.isIOS && isIOSHapticSupported()) {
    triggerIOSHaptic(type);
    return;
  }

  // Use Vibration API for Android/desktop
  if (deviceInfo.supportsVibration) {
    const pattern = getVibrationPattern(type);
    triggerVibration(pattern);
    return;
  }

  // Graceful fallback - no haptic, but no error
  console.debug("[Haptics] Haptic feedback not available on this device");
};

/**
 * Trigger haptic feedback
 * @param type - Type of haptic feedback
 * @param options - Options for debouncing/throttling
 */
export const triggerHaptic = (
  type: HapticType = "light",
  options?: { debounce?: boolean; throttle?: boolean }
): void => {
  triggerHapticCore(type, options || {});
};

/**
 * Check if haptic feedback is supported
 * Re-exported from device-detection for convenience
 */
export { isHapticSupported } from "./device-detection";

/**
 * Haptic feedback for button clicks
 * Uses debouncing to prevent rapid successive haptics
 */
export const hapticButton = (): void => {
  triggerHaptic("light", { debounce: true });
};

/**
 * Haptic feedback for selection (e.g., picking an option)
 * Light, quick feedback
 */
export const hapticSelection = (): void => {
  triggerHaptic("selection", { debounce: true });
};

/**
 * Haptic feedback for successful actions
 * Positive confirmation pattern
 */
export const hapticSuccess = (): void => {
  triggerHaptic("success");
};

/**
 * Haptic feedback for errors
 * Strong error pattern
 */
export const hapticError = (): void => {
  triggerHaptic("error");
};

/**
 * Haptic feedback for warnings
 * Attention-grabbing pattern
 */
export const hapticWarning = (): void => {
  triggerHaptic("warning");
};

/**
 * Haptic feedback for navigation
 * Uses throttling to prevent too many haptics during scrolling/swiping
 */
export const hapticNavigation = (): void => {
  triggerHaptic("medium", { throttle: true });
};

/**
 * Haptic feedback for impact (e.g., dropping, landing)
 * Medium strength feedback
 */
export const hapticImpact = (): void => {
  triggerHaptic("impact");
};

/**
 * Haptic feedback for notifications
 * Success-like pattern for positive notifications
 */
export const hapticNotification = (): void => {
  triggerHaptic("notification");
};

/**
 * Enable haptic feedback (saves to localStorage)
 */
export const enableHaptics = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("haptics-enabled", "true");
  } catch (error) {
    console.debug("[Haptics] Failed to enable haptics:", error);
  }
};

/**
 * Disable haptic feedback (saves to localStorage)
 */
export const disableHaptics = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("haptics-enabled", "false");
  } catch (error) {
    console.debug("[Haptics] Failed to disable haptics:", error);
  }
};

/**
 * Check if haptics are enabled (checks user preference)
 */
export const isHapticsEnabled = (): boolean => {
  const preference = getHapticsPreference();
  // Default to enabled if no preference is set
  return preference !== false;
};
