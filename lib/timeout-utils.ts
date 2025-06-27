/**
 * Utility functions for safe timeout handling
 */

/**
 * Safely set a timeout with validation to prevent negative values
 * @param callback The function to execute after the timeout
 * @param delay The delay in milliseconds (will be clamped to minimum 0)
 * @returns The timeout ID
 */
export function safeSetTimeout(callback: () => void, delay: number): NodeJS.Timeout {
  // Ensure delay is never negative
  const safeDelay = Math.max(0, delay);
  
  // Warn in development if negative delay was provided
  if (process.env.NODE_ENV === 'development' && delay < 0) {
    console.warn(
      `safeSetTimeout: Negative delay (${delay}ms) was provided. Using 0ms instead.`,
      new Error().stack
    );
  }
  
  return setTimeout(callback, safeDelay);
}

/**
 * Calculate a timeout duration from a future date
 * @param futureDate The target date/time
 * @param now Optional current time (defaults to Date.now())
 * @returns The duration in milliseconds (minimum 0)
 */
export function calculateTimeoutDuration(futureDate: Date | number, now: number = Date.now()): number {
  const targetTime = typeof futureDate === 'number' ? futureDate : futureDate.getTime();
  const duration = targetTime - now;
  
  // Return 0 if the target time is in the past
  return Math.max(0, duration);
}

/**
 * Set a timeout to execute at a specific time
 * @param callback The function to execute
 * @param targetTime The target date/time
 * @returns The timeout ID
 */
export function setTimeoutAt(callback: () => void, targetTime: Date | number): NodeJS.Timeout {
  const duration = calculateTimeoutDuration(targetTime);
  return safeSetTimeout(callback, duration);
}