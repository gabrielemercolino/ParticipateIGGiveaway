import { waitForElement } from "../utils/dom";
import { logError } from "../utils/logger";

export type GiveawayResult =
  | { status: "participated" }
  | { status: "alreadyParticipated" }
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
  urls: string[],
  onResult: (result: GiveawayResult, index: number) => void,
  delayMs: number = 0
): Promise<void> {
  const giveTab = window.open("", "ig-giveaway-processor");
  if (!giveTab) throw new Error("Unable to open giveaway processing window");
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await processGiveaway(giveTab, url);
    onResult(result, i);
    if (delayMs > 0)
      await new Promise<void>((res) => setTimeout(() => res(), delayMs));
  }

  // Wait and close the tab
  await new Promise<void>((res) => setTimeout(() => res(), 1000));
  giveTab.close();
}

/**
 * Automates participation for a giveaway.
 * @param tab The window to use
 * @param url The giveaway link
 */
async function processGiveaway(
  tab: Window,
  url: string
): Promise<GiveawayResult> {
  try {
    tab.location.href = url;
    await waitForTabReady(tab);
    const doc = tab.document;
    if (!doc)
      return {
        status: "error",
        error: new Error("Unable to access window document"),
      };

    // Override window.open to block popups/new windows
    try {
      if (doc.defaultView) doc.defaultView.open = () => null;
    } catch (err) {
      // Not returning as this is non-critical
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
      return { status: "participated" };
    } else {
      // If the button does not exist, participation is already done
      // Try to click boost buttons anyway but with a smaller delay
      await clickBoostButtons(doc, 1000);
      return { status: "alreadyParticipated" };
    }
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}

/**
 * Waits for the tab to be fully loaded
 * @param tab the window
 */
function waitForTabReady(tab: Window): Promise<void> {
  return new Promise((resolve) => {
    if (tab.document.readyState === "complete") {
      resolve();
      return;
    }
    tab.addEventListener("load", () => resolve(), { once: true });
  });
}

/**
 * Clicks all boost buttons on the page
 *
 * If the boost section is not found, it waits for it to load for 5 seconds
 * and then clicks all boost buttons
 * @param doc document object
 * @param timeoutMs maximum time to wait for the boost section (default 5000ms)
 */
async function clickBoostButtons(doc: Document, timeoutMs: number = 5000) {
  if (doc.querySelector(BOOST_BUTTON_SECTION_SELECTOR) === null)
    await waitForElement(doc, BOOST_BUTTON_SECTION_SELECTOR, timeoutMs);

  const boostButtons = doc.querySelectorAll<
    HTMLButtonElement | HTMLAnchorElement
  >(BOOST_BUTTON_SELECTOR);
  if (boostButtons.length === 0) return;

  for (const boostButton of boostButtons) {
    boostButton.scrollIntoView({ behavior: "smooth", block: "center" });
    await new Promise((res) => setTimeout(res, 1_000));
    boostButton.click();
  }
}
