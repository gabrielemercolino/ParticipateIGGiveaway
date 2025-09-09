/**
 * Logs a network error to the console (and optionally to a file or endpoint).
 * @param error The error object or message.
 * @param context Optional context string to identify where the error occurred.
 */
export function logNetworkError(error: unknown, context?: string) {
  console.error(`[Network Error]${context ? ' [' + context + ']' : ''}:`, error);
}

/**
 * Logs a DOM error to the console (and optionally to a file or endpoint).
 * @param error The error object or message.
 * @param context Optional context string to identify where the error occurred.
 */
export function logDomError(error: unknown, context?: string) {
  console.error(`[DOM Error]${context ? ' [' + context + ']' : ''}:`, error);
}

/**
 * Logs a generic error to the console (and optionally to a file or endpoint).
 * @param error The error object or message.
 * @param context Optional context string to identify where the error occurred.
 */
export function logError(error: unknown, context?: string) {
  console.error(`[Error]${context ? ' [' + context + ']' : ''}:`, error);
}
