/**
 * Offline Queue Utility
 * Manages queued actions when offline and syncs when connection is restored
 */

interface QueuedAction {
  id: string;
  type: "cart-add" | "cart-remove" | "cart-update";
  payload: unknown;
  timestamp: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = "offline-queue";
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 50;

/**
 * Get all queued actions from storage
 */
export function getQueuedActions(): QueuedAction[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading offline queue:", error);
    return [];
  }
}

/**
 * Add an action to the offline queue
 */
export function queueAction(action: Omit<QueuedAction, "timestamp" | "retries">): void {
  if (typeof window === "undefined") return;

  const actions = getQueuedActions();

  // Prevent queue from growing too large
  if (actions.length >= MAX_QUEUE_SIZE) {
    // Remove oldest actions
    actions.splice(0, actions.length - MAX_QUEUE_SIZE + 1);
  }

  const newAction: QueuedAction = {
    ...action,
    timestamp: Date.now(),
    retries: 0,
  };

  actions.push(newAction);

  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error("Error saving to offline queue:", error);
  }
}

/**
 * Remove an action from the queue
 */
export function removeQueuedAction(actionId: string): void {
  if (typeof window === "undefined") return;

  const actions = getQueuedActions().filter((action) => action.id !== actionId);

  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(actions));
  } catch (error) {
    console.error("Error removing from offline queue:", error);
  }
}

/**
 * Clear all queued actions
 */
export function clearQueue(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing offline queue:", error);
  }
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

/**
 * Process queued actions when connection is restored
 */
export async function processQueue(
  processor: (action: QueuedAction) => Promise<void>,
): Promise<void> {
  if (!isOnline()) return;

  const actions = getQueuedActions();
  if (actions.length === 0) return;

  const processed: string[] = [];
  const failed: QueuedAction[] = [];

  for (const action of actions) {
    try {
      await processor(action);
      processed.push(action.id);
    } catch (error) {
      console.error(`Failed to process queued action ${action.id}:`, error);

      // Increment retry count
      action.retries += 1;

      // Only keep actions that haven't exceeded max retries
      if (action.retries < MAX_RETRIES) {
        failed.push(action);
      } else {
        console.warn(`Action ${action.id} exceeded max retries, removing from queue`);
      }
    }
  }

  // Remove processed actions
  processed.forEach((id) => removeQueuedAction(id));

  // Update failed actions with new retry counts
  if (failed.length > 0) {
    const remaining = getQueuedActions().filter(
      (action) => !processed.includes(action.id),
    );
    failed.forEach((action) => {
      const index = remaining.findIndex((a) => a.id === action.id);
      if (index !== -1) {
        remaining[index] = action;
      } else {
        remaining.push(action);
      }
    });

    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remaining));
    } catch (error) {
      console.error("Error updating failed actions in queue:", error);
    }
  }
}

/**
 * Hook to listen for online/offline events and process queue
 */
export function setupOfflineQueueListener(
  processor: (action: QueuedAction) => Promise<void>,
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    processQueue(processor);
  };

  window.addEventListener("online", handleOnline);

  // Process queue immediately if already online
  if (isOnline()) {
    processQueue(processor);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}

