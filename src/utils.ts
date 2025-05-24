import { GIVEAWAYS_REPO, SELECTORS } from "./constants";

// Cache for giveaways to avoid multiple requests
let giveawaysCache: Map<string, string[]> | null = null;

/**
 * Waits for a given time in milliseconds
 * @param time_ms time in milliseconds to sleep
 */
export async function sleep(time_ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, time_ms));
}

/**
 * Loads the giveaways from the server
 * @returns a map of regions and their respective giveaway names
 * @throws Error if the request fails
 */
export async function giveaways(): Promise<Map<string, string[]>> {
  if (giveawaysCache) {
    return giveawaysCache;
  }

  try {
    const response = await GM.xmlHttpRequest({
      method: "GET",
      url: GIVEAWAYS_REPO,
      headers: { "Content-Type": "application/json" },
    });

    // Tampermonkey has `response.responseText` but Greasemonkey has `response.response`
    const text = response.responseText ?? response.response;

    const obj = JSON.parse(text);
    // Convert the object to a Map
    // this is necessary as a normal object would contain more properties
    giveawaysCache = new Map(Object.entries(obj));
    return giveawaysCache;
  } catch (error) {
    console.error("Error loading giveaways:", error);
    throw new Error("Unable to load giveaways");
  }
}

/**
 * Checks if the giveaway is not found (404)
 * @param doc Document to check
 * @returns true if the giveaway has 404 status
 */
export function isGiveaway404(doc: Document): boolean {
  return doc.querySelector(SELECTORS._404) !== null;
}

/**
 * Checks if the giveaway has ended
 * @param doc Document to check
 * @returns true if the giveaway has ended
 */
export function isGiveawayEnded(doc: Document): boolean {
  return doc.querySelector(SELECTORS.ended) !== null;
}

/**
 * @param doc Document to check
 * @returns the button to click to validate the participation or null if not found
 */
export function getValidationButton(doc: Document): HTMLButtonElement | null {
  return doc.querySelector(SELECTORS.participateButton);
}

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
    observer.observe(doc, { childList: true, subtree: true });

    // If the element is not found within the timeout, resolve with null
    // and disconnect the observer
    setTimeout(() => {
      observer.disconnect();
      // An empty NodeList will be returned if nothing is found
      resolve(element);
    }, timeout);
  });
}

/**
 * Calculates the total number of giveaways
 * @param giveaways Map of regions and their respective giveaway names
 * @returns total number of giveaways
 */
export function calculateTotal(giveaways: Map<string, string[]>): number {
  let total = 0;
  for (const [region, names] of giveaways.entries()) {
    if (region === "ended") continue; // skip ended giveaways
    total += names.length;
  }
  return total;
}
