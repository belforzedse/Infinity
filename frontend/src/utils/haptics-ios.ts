/**
 * iOS Haptic Feedback Implementation
 * Uses hidden checkbox trick to trigger iOS haptic feedback
 * Works in iOS Safari (including iOS 18) by leveraging native UI element haptics
 */

type IOSHapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection" | "impact" | "notification";

/**
 * Check if we're on iOS
 */
const isIOSDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
};

/**
 * Create and trigger iOS haptic via hidden checkbox
 * iOS provides haptic feedback when native UI elements like switches are toggled
 *
 * IMPORTANT: This must be called within a user interaction context (click, touch, etc.)
 * The checkbox.click() method simulates a user click, which triggers iOS haptics
 */
const triggerIOSHapticCheckbox = (): void => {
  if (typeof document === "undefined") return;

  try {
    // Create a hidden checkbox element
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.cssText = `
      position: absolute;
      opacity: 0;
      pointer-events: none;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    `;
    checkbox.setAttribute("aria-hidden", "true");
    checkbox.tabIndex = -1;

    // Append to body
    document.body.appendChild(checkbox);

    // IMPORTANT: Call click() synchronously to stay within user interaction context
    // iOS requires haptics to be triggered during a user interaction event
    // Since this function is called from click/touch handlers, we're already in that context
    try {
      // Use .click() method to simulate user interaction
      // This triggers iOS haptic feedback because it's a "real" click event
      checkbox.click();
    } catch (clickError) {
      // If click() fails, try programmatic toggle as fallback
      checkbox.checked = !checkbox.checked;
    }

    // Clean up after a short delay to ensure haptic is triggered
    setTimeout(() => {
      if (checkbox.parentNode) {
        document.body.removeChild(checkbox);
      }
    }, 50);
  } catch (error) {
    // Silently fail if checkbox creation fails
    console.debug("[Haptics iOS] Failed to trigger haptic:", error);
  }
};

/**
 * Trigger multiple haptic pulses for complex patterns
 */
const triggerIOSHapticPattern = (count: number, delay: number = 50): void => {
  if (count <= 0) return;

  triggerIOSHapticCheckbox();

  if (count > 1) {
    let remaining = count - 1;
    const interval = setInterval(() => {
      triggerIOSHapticCheckbox();
      remaining--;
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, delay);
  }
};

/**
 * Map haptic types to iOS patterns
 * iOS doesn't support intensity levels, so we use timing and repetition
 */
export const triggerIOSHaptic = (type: IOSHapticType): void => {
  if (!isIOSDevice()) return;

  switch (type) {
    case "light":
    case "selection":
      // Single light tap
      triggerIOSHapticCheckbox();
      break;

    case "medium":
    case "impact":
      // Single medium tap (same as light on iOS, but semantically different)
      triggerIOSHapticCheckbox();
      break;

    case "heavy":
      // Slightly longer delay for "heavier" feel
      triggerIOSHapticCheckbox();
      setTimeout(() => triggerIOSHapticCheckbox(), 30);
      break;

    case "success":
    case "notification":
      // Success pattern: short-long-short
      triggerIOSHapticCheckbox();
      setTimeout(() => {
        triggerIOSHapticCheckbox();
        setTimeout(() => triggerIOSHapticCheckbox(), 50);
      }, 50);
      break;

    case "warning":
      // Warning pattern: double tap
      triggerIOSHapticCheckbox();
      setTimeout(() => triggerIOSHapticCheckbox(), 30);
      break;

    case "error":
      // Error pattern: triple strong tap
      triggerIOSHapticPattern(3, 50);
      break;

    default:
      triggerIOSHapticCheckbox();
  }
};

/**
 * Check if iOS haptic feedback is available
 */
export const isIOSHapticSupported = (): boolean => {
  return isIOSDevice();
};

