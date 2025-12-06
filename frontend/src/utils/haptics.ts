/**
 * Haptic Feedback Utility
 * Provides native-like haptic feedback for mobile interactions
 * Falls back gracefully on unsupported devices
 */

type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

/**
 * Check if haptic feedback is supported
 */
export const isHapticSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return "vibrate" in navigator || "vibrate" in window.navigator;
};

/**
 * Trigger haptic feedback
 * @param type - Type of haptic feedback (light, medium, heavy, success, warning, error)
 */
export const triggerHaptic = (type: HapticType = "light"): void => {
  if (typeof window === "undefined" || !isHapticSupported()) return;

  const patterns: Record<HapticType, number | number[]> = {
    light: 10, // Very short vibration
    medium: 20, // Medium vibration
    heavy: 30, // Strong vibration
    success: [10, 50, 10], // Short-long-short pattern
    warning: [20, 30, 20], // Medium pattern
    error: [30, 50, 30, 50, 30], // Strong error pattern
  };

  const pattern = patterns[type];
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (error) {
    // Silently fail if vibration is not supported
    console.debug("Haptic feedback not available:", error);
  }
};

/**
 * Haptic feedback for button clicks
 */
export const hapticButton = (): void => {
  triggerHaptic("light");
};

/**
 * Haptic feedback for successful actions
 */
export const hapticSuccess = (): void => {
  triggerHaptic("success");
};

/**
 * Haptic feedback for errors
 */
export const hapticError = (): void => {
  triggerHaptic("error");
};

/**
 * Haptic feedback for warnings
 */
export const hapticWarning = (): void => {
  triggerHaptic("warning");
};

/**
 * Haptic feedback for navigation
 */
export const hapticNavigation = (): void => {
  triggerHaptic("medium");
};

