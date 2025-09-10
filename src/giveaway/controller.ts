import { waitForElement } from "../utils/dom";
import { logError } from "../utils/logger";

export type GiveawayResult =
  | { status: "participated" }
  | { status: "already_participated" }
  | { status: "timeout" }
  | { status: "error"; error: Error };

const PARTICIPATE_BUTTON_SELECTOR = "button.button.validate";
const BOOST_BUTTON_SECTION_SELECTOR = ".participation-state.has-participation";
const BOOST_BUTTON_SELECTOR = ".button.reward:not(.success)";

/**
 * Processes a list of giveaways in sequence, notifying the status via callback.
 * @param iframe The iframe to use
 * @param urls List of URLs to process
 * @param onResult Callback for each result
 * @param delayMs Optional delay between giveaways (default 0)
 */
export async function processGiveaways(
  iframe: HTMLIFrameElement,
  urls: string[],
  onResult: (result: GiveawayResult, index: number) => void,
  delayMs: number = 0
): Promise<void> {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await processGiveaway(iframe, url);
    onResult(result, i);
    if (delayMs > 0 && i < urls.length - 1) {
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

/**
 * Loads a URL in the iframe and automates participation.
 * @param iframe The iframe element to use
 * @param url The giveaway link
 * @param timeoutMs Maximum timeout for the procedure (default 20000ms)
 */
function processGiveaway(
  iframe: HTMLIFrameElement,
  url: string,
  timeoutMs = 20_000
): Promise<GiveawayResult> {
  return new Promise<GiveawayResult>((resolve) => {
    let timeout: number | undefined;
    function cleanup() {
      if (timeout) clearTimeout(timeout);
      iframe.removeEventListener("load", onLoad);
    }

    async function onLoad() {
      try {
        const doc = iframe.contentDocument;
        if (!doc) throw new Error("Unable to access iframe document");

        // Override window.open to block popups/new windows
        try {
          if (doc.defaultView) {
            doc.defaultView.open = () => null;
          }
        } catch (err) {
          logError(
            `Failed to override window.open: ${
              err instanceof Error ? err.message : String(err)
            }`,
            "processGiveaway"
          );
        }

        // Look for the "Participate" button
        const participateBtn = doc.querySelector(PARTICIPATE_BUTTON_SELECTOR);

        if (participateBtn) {
          (participateBtn as HTMLButtonElement).click();
          // After the click, wait for the boost buttons to appear
          await clickBoostButtons(doc);
          cleanup();
          resolve({ status: "participated" });
          return;
        } else {
          // If the button does not exist, participation is already done
          const boostBtns = Array.from(
            doc.querySelectorAll(BOOST_BUTTON_SELECTOR)
          );
          boostBtns.forEach((btn) => {
            const button = btn as HTMLButtonElement;
            button.scrollIntoView({ behavior: "smooth", block: "center" });
            button.click();
          });
          cleanup();
          resolve({ status: "already_participated" });
          return;
        }
      } catch (e) {
        cleanup();
        resolve({
          status: "error",
          error: e instanceof Error ? e : new Error(String(e)),
        });
      }
    }

    // Timeout
    timeout = window.setTimeout(() => {
      cleanup();
      resolve({ status: "timeout" });
    }, timeoutMs);

    iframe.addEventListener("load", onLoad, { once: true });
    iframe.src = url;
  });
}

/**
 * Clicks all boost buttons on the page
 *
 * If the boost section is not found, it waits for it to load for 5 seconds
 * and then clicks all boost buttons
 * @param doc document object
 */
async function clickBoostButtons(doc: Document) {
  if (doc.querySelector(BOOST_BUTTON_SECTION_SELECTOR) === null) {
    await waitForElement(doc, BOOST_BUTTON_SECTION_SELECTOR, 5000);
  }
  const boostButtons = doc.querySelectorAll<
    HTMLButtonElement | HTMLAnchorElement
  >(BOOST_BUTTON_SELECTOR);
  for (const boostButton of boostButtons) {
    boostButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
    boostButton.click();
  }
}
