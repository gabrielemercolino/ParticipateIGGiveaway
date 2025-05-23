import { SELECTORS, VERSION } from "./constants";
import {
  getValidationButton,
  isGiveaway404,
  isGiveawayEnded,
  loadGiveaways,
  sleep,
  waitForElement,
} from "./utils";

/**
 * Participates in all giveaways
 *
 * This function loads the giveaways from the server and then participates in each giveaway
 *
 * It uses an iframe to load the giveaway page and then clicks the participate button
 *
 * It also handles errors and timeouts
 */
export async function participateGiveaways(): Promise<void> {
  type GiveLog = Map<string, string[]>;
  const participated: GiveLog = new Map();
  let participatedCount = 0;
  const alreadyParticipated: GiveLog = new Map();
  let alreadyParticipatedCount = 0;
  const ended: GiveLog = new Map();
  let endedCount = 0;
  const notFound: GiveLog = new Map();
  let notFoundCount = 0;
  const timeout: GiveLog = new Map();
  let timeoutCount = 0;
  const errors: Map<string, { name: string; message: string }[]> = new Map();
  let errorsCount = 0;

  // create iframe
  const iframe = createIframe();
  document.body.appendChild(iframe);

  const giveaways = await loadGiveaways();
  console.log("giveaways: ", giveaways);

  for (const [region, names] of giveaways.entries()) {
    if (region === "ended") continue;
    for (const name of names) {
      const result = await participateGiveaway(
        `https://www.instant-gaming.com/${region}/giveaway/${name}`,
        iframe
      );
      switch (result.status) {
        case "participated":
          participatedCount++;
          updateLog(participated, region, name);
          break;
        case "already participated":
          alreadyParticipatedCount++;
          updateLog(alreadyParticipated, region, name);
          break;
        case "404":
          notFoundCount++;
          updateLog(notFound, region, name);
          break;
        case "ended":
          endedCount++;
          updateLog(ended, region, name);
          break;
        case "timeout":
          timeoutCount++;
          updateLog(timeout, region, name);
          break;
        case "error":
          errorsCount++;
          const errs = errors.get(region) ?? [];
          errs.push({ name, message: result.message });
          errors.set(region, errs);
          break;
      }
    }
  }

  const total =
    participatedCount +
    alreadyParticipatedCount +
    notFoundCount +
    endedCount +
    timeoutCount +
    errorsCount;

  alert(
    `ParticipateIGGiveaway v${VERSION}
  Total: ${total}
  Participated: ${participatedCount}
  Already participated: ${alreadyParticipatedCount}
  404: ${notFoundCount}
  Ended: ${endedCount}
  Timeout: ${timeoutCount}
  Errors: ${errorsCount}
  Check console for more details`
  );

  console.log("Participated: ", participated);
  console.log("Already participated: ", alreadyParticipated);
  console.log("404: ", notFound);
  console.log("Ended: ", ended);
  console.log("Timeout: ", timeout);
  console.log("Errors: ", errors);

  // remove iframe
  iframe.remove();
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
        await sleep(200);
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

/**
 * Creates an iframe element with some styles applied
 * @returns iframe element with styles applied
 */
function createIframe() {
  const iframe = document.createElement("iframe");

  Object.assign(iframe.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    width: "30dvw",
    height: "90dvh",
    transform: "translate(-50%, -50%)",
    zIndex: "9999",
    border: "2px solid #ccc",
    borderRadius: "0px",
  });

  return iframe;
}

/**
 * Utily function to update a map with a key and value
 * @param map map to update
 * @param key key to update
 * @param value value to add
 */
function updateLog<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const arr = map.get(key) ?? [];
  arr.push(value);
  map.set(key, arr);
}
