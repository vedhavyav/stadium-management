/**
 * Security utilities for input sanitization and client-side API rate-limiting
 */

/**
 * Sanitizes input strings to neutralize HTML tags and script injections
 */
export function sanitizeInput(text: string): string {
  if (!text) return "";
  // Strip out HTML markup
  let clean = text.replace(/<[^>]*>/g, "");
  // Escape potentially dangerous characters into HTML entity representations
  clean = clean
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
  return clean.trim();
}

/**
 * In-memory token-bucket style rate limiter to throttle client-side API interactions
 */
export class ClientRateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindowMs: number;

  constructor(maxRequests = 5, timeWindowMs = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
  }

  /**
   * Registers a call attempt. Returns true if allowed, false if throttled.
   */
  allowRequest(): boolean {
    const now = Date.now();
    // Keep timestamps only within the active sliding window
    this.timestamps = this.timestamps.filter(ts => now - ts < this.timeWindowMs);

    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(now);
      return true;
    }
    return false;
  }

  /**
   * Returns cooling period length in seconds
   */
  getCooldownSeconds(): number {
    if (this.timestamps.length === 0) return 0;
    const now = Date.now();
    const oldest = this.timestamps[0];
    const remainingMs = this.timeWindowMs - (now - oldest);
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }
}
