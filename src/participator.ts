import { SELECTORS } from "./constants";
import {
  getValidationButton,
  isGiveaway404,
  isGiveawayEnded,
  sleep,
  waitForElement,
} from "./utils";

export type ParticipationUpdate =
  | { status: "participated"; region: string; name: string }
  | { status: "already participated"; region: string; name: string }
  | { status: "ended"; region: string; name: string }
  | { status: "404"; region: string; name: string }
  | { status: "timeout"; region: string; name: string };

export type ParticipationError = { name: string; message: string };

/**
 * Participates in all giveaways
 *
 * This function loads the giveaways from the server and then participates in each giveaway
 *
 * It uses an iframe to load the giveaway page and then clicks the participate button
 *
 * It also handles errors and timeouts
 */
export async function participateGiveaways(
  iframe: HTMLIFrameElement,
  giveaways: Map<string, string[]>,
  onUpdate: (kind: ParticipationUpdate) => void = () => {},
  onError: (error: ParticipationError) => void = () => {}
): Promise<void> {
  console.log("giveaways: ", giveaways);

  for (const [region, names] of giveaways.entries()) {
    if (region === "ended") continue;
    for (const name of names) {
      const result = await participateGiveaway(
        `https://www.instant-gaming.com/${region}/giveaway/${name}`,
        iframe
      );

      if (result.status === "error") {
        onError({
          message: result.message,
          name: name,
        });
        return;
      }

      onUpdate({
        status: result.status,
        region: region,
        name: name,
      });
    }
  }
}

type ParticipationStatus =
  | { status: "participated" }
  | { status: "already participated" }
  | { status: "ended" }
  | { status: "404" }
  | { status: "timeout" }
  | { status: "error"; message: string };

/**
 * Participates in a giveaway
 *
 * @param link the link to the giveaway
 * @param iframe the iframe element to load the giveaway in
 * @returns the result of the participation
 */
async function participateGiveaway(
  link: string,
  iframe: HTMLIFrameElement
): Promise<ParticipationStatus> {
  return new Promise((resolve) => {
    iframe.src = link;

    // wait for iframe to load
    // and if it can't load in 10 seconds, resolve with timeout
    const timeout = setTimeout(() => {
      resolve({ status: "timeout" });
    }, 10000);

    iframe.onload = async () => {
      // timeout is cleared when iframe is loaded
      clearTimeout(timeout);

      // check if iframe properly loaded
      if (iframe.contentWindow === null) {
        resolve({ status: "error", message: "Iframe not loaded" });
        return;
      }
      if (iframe.contentWindow.location.href !== link) {
        resolve({ status: "error", message: "Giveaway page not loaded" });
        return;
      }

      // document object of the iframe
      const doc = iframe.contentWindow.document;

      if (isGiveaway404(doc)) {
        resolve({ status: "404" });
        return;
      }

      if (isGiveawayEnded(doc)) {
        resolve({ status: "ended" });
        return;
      }

      // don't bother opening boost pages as not necessary
      iframe.contentWindow.open = () => null;

      const participateButton = getValidationButton(doc);

      // if not found then it means already participated
      if (!participateButton) {
        // still try to click boost buttons as could have been missed
        // by previous runs
        await clickBoostButtons(doc);
        await sleep(500);
        resolve({ status: "already participated" });
        return;
      }
      participateButton.scrollIntoView({ behavior: "smooth", block: "center" });
      participateButton.click();
      await clickBoostButtons(doc);
      await sleep(1000);
      resolve({ status: "participated" });
    };
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
  if (doc.querySelector(SELECTORS.boostSection) === null) {
    await waitForElement(doc, SELECTORS.boostSection, 5000);
  }
  const boostButtons = doc.querySelectorAll<
    HTMLButtonElement | HTMLAnchorElement
  >(SELECTORS.boostButtons);
  for (const boostButton of boostButtons) {
    boostButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
    boostButton.click();
    await sleep(1000);
  }
}
