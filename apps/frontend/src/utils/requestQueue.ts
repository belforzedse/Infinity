/**
 * Request Queue Manager
 * Ensures cart mutations are processed sequentially to prevent race conditions
 * Handles failures and retries gracefully
 */

type QueuedRequest<T> = {
  id: string;
  executor: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

export class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  /**
   * Add a request to the queue
   */
  async enqueue<T>(executor: () => Promise<T>, id?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: id || `req-${Date.now()}-${Math.random()}`,
        executor,
        resolve,
        reject,
      };

      this.queue.push(request);
      this.processQueue();
    });
  }

  /**
   * Process queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) continue;

      try {
        // Execute with retries
        const result = await this.executeWithRetry(request.executor);
        request.resolve(result);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        request.reject(err);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute request with automatic retries on failure
   */
  private async executeWithRetry<T>(
    executor: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await executor();
    } catch (error) {
      if (attempt < this.maxRetries) {
        // Wait before retrying with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeWithRetry(executor, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Get queue size (for debugging)
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue (use with caution)
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Check if currently processing
   */
  isProcessingRequest(): boolean {
    return this.isProcessing;
  }
}

// Export singleton instance
export const cartRequestQueue = new RequestQueue();
