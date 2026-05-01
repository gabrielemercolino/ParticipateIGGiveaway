import { waitForElement } from '../utils/dom';
import { logError } from '../utils/logger';

export type GiveawayResult =
  | { status: 'participated' }
  | { status: 'alreadyParticipated' }
  | { status: 'timeout' }
  | { status: 'error'; error: Error };

const SELECTORS = {
  participateButton: 'button.button.validate',
  boostSection: '.participation-state.has-participation',
  boostButton: '.button.reward:not(.success)',
} as const;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Processes a list of giveaways in sequence, notifying the status via callback.
 * @param iframe The iframe to use
 * @param urls List of URLs to process
 * @param onResult Callback for each result
 * @param delayMs Optional delay between giveaways (default 0)
 */
export async function processGiveaways(
  urls: string[],
  onResult: (result: GiveawayResult) => void,
  delayMs: number = 0,
): Promise<void> {
  const giveTab = window.open('', 'ig-giveaway-processor');
  if (!giveTab) throw new Error('Unable to open giveaway processing window');

  for (let i = 0; i < urls.length; i++) {
    const result = await processGiveaway(giveTab, urls[i]);
    onResult(result);
    if (delayMs > 0) await sleep(delayMs);
  }
  await sleep(1_000);
  giveTab.close();
}

/**
 * Automates participation for a giveaway.
 * @param tab The window to use
 * @param url The giveaway link
 */
async function processGiveaway(
  tab: Window,
  url: string,
): Promise<GiveawayResult> {
  try {
    tab.location.href = url;
    await waitForTabReady(tab, url);
    if (!tab.document)
      return {
        status: 'error',
        error: new Error('Unable to access window document'),
      };

    // Override window.open to block popups/new windows
    try {
      if (tab.document.defaultView) tab.document.defaultView.open = () => null;
    } catch (err) {
      // Not returning as this is non-critical
      logError(
        'Failed to override window.open:',
        err instanceof Error ? err.message : String(err),
        'processGiveaway',
      );
    }

    // Look for the "Participate" button
    const participateBtn = tab.document.querySelector(
      SELECTORS.participateButton,
    );

    if (participateBtn) {
      (participateBtn as HTMLButtonElement).click();
      // After the click, wait for the boost buttons to appear
      await clickBoostButtons(tab.document);
      return { status: 'participated' };
    } else {
      // If the button does not exist, participation is already done
      // Try to click boost buttons anyway but with a smaller delay
      await clickBoostButtons(tab.document, 1000);
      return { status: 'alreadyParticipated' };
    }
  } catch (e) {
    return {
      status: 'error',
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}

/**
 * Waits for the tab to be fully loaded
 * @param tab the window
 * @param url the new url
 */
async function waitForTabReady(tab: Window, url: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const check = () => {
      try {
        if (
          tab.document.readyState !== 'complete' ||
          tab.location.href === url
        ) {
          tab.addEventListener('load', () => resolve(), { once: true });
          if (tab.document.readyState === 'complete') resolve(); // caricata nel frattempo
        } else {
          setTimeout(check, 50);
        }
      } catch {
        tab.addEventListener('load', () => resolve(), { once: true });
      }
    };
    setTimeout(check, 50);
  });
}

/**
 * Clicks all boost buttons on the page
 *
 * If the boost section is not found, it waits for it to load for the specified timeout
 * and then clicks all boost buttons
 * @param doc document object
 * @param timeoutMs maximum time to wait for the boost section (default 5000ms)
 */
async function clickBoostButtons(doc: Document, timeoutMs: number = 5000) {
  await waitForElement(doc, SELECTORS.boostSection, timeoutMs);

  const boostButtons = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>(SELECTORS.boostButton),
  );
  if (boostButtons.length === 0) return;

  boostButtons[boostButtons.length - 1].scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
  for (const boostButton of boostButtons) boostButton.click();
}
