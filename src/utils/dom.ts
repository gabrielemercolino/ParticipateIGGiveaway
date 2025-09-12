import { logError } from "./logger";

/**
 * Tries to get the element with the given selector,
 * if not found waits for the dom to update within the time limit
 * to retrieve the element
 * @param doc Document to check
 * @param selector the selector of the element to retrieve
 * @param timeout max time to wait for the element to be found
 * @returns the element if found, null otherwise
 */
export function waitForElement<T extends Element>(
  doc: Document,
  selector: string,
  timeout: number = 5000
): Promise<T | null> {
  return new Promise((resolve) => {
    // Check if there is at least one element matching the selector
    const element = doc.querySelector<T>(selector);
    if (element !== null) {
      resolve(element);
      return;
    }

    // use a mutation observer to wait for the element to be added
    // to the DOM
    const observer = new MutationObserver(() => {
      const element = doc.querySelector<T>(selector);
      if (element !== null) {
        observer.disconnect();
        resolve(element);
      }
    });

    // Observe changes in the DOM, including direct children (childList)
    // and all descendant nodes (subtree) to detect the addition of the target element.
    observer.observe(doc.body, { childList: true, subtree: true });

    // If the element is not found within the timeout disconnect the observer
    // and re-query for the last time in case it appeared just before the timeout
    setTimeout(() => {
      observer.disconnect();
      // Re-query for the element in case it appeared before the timeout
      const latestElement = doc.querySelector<T>(selector);
      if (!latestElement) {
        logError(
          `Element '${selector}' not found after ${timeout}ms`,
          "waitForElement"
        );
      }
      resolve(latestElement);
    }, timeout);
  });
}
