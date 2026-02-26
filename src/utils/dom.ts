import { logError } from './logger';

const POLL_INTERVAL_MS = 150;

/**
 * Polls for an element matching the selector until it appears or timeout expires.
 * @param doc Document to search in
 * @param selector CSS selector to match
 * @param timeout Maximum time to wait in milliseconds (default 5000)
 * @returns The element if found, null otherwise
 */
export function waitForElement<T extends Element>(
  doc: Document,
  selector: string,
  timeout: number = 5000,
): Promise<T | null> {
  return new Promise((resolve) => {
    const element = doc.querySelector<T>(selector);
    if (element !== null) {
      resolve(element);
      return;
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      const element = doc.querySelector<T>(selector);
      if (element !== null) {
        clearInterval(interval);
        resolve(element);
        return;
      }

      elapsed += POLL_INTERVAL_MS;
      if (elapsed >= timeout) {
        clearInterval(interval);
        logError(
          `Element '${selector}' not found after ${timeout}ms`,
          'waitForElement',
        );
        resolve(null);
      }
    }, POLL_INTERVAL_MS);
  });
}
