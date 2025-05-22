import { GIVEAWAYS_REPO, SELECTORS } from "./constants";
import { Gives } from "./types";

export async function sleep(time_ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, time_ms));
}

export async function loadGiveaways(): Promise<Gives> {
  try {
    const response = await GM.xmlHttpRequest({
      method: "GET",
      url: GIVEAWAYS_REPO,
      headers: { "Content-Type": "application/json" },
    });

    // Tampermonkey has `response.responseText` but Greasemonkey has `response.response`
    const text = response.responseText ?? response.response;

    const obj = JSON.parse(text);
    return new Map(Object.entries(obj));
  } catch (error) {
    console.error("Errore durante il caricamento dei giveaway:", error);
    throw new Error("Impossibile caricare i giveaway");
  }
}

export function isGiveaway404(doc: Document): boolean {
  return doc.querySelector(SELECTORS._404) !== null;
}

export function isGiveawayEnded(doc: Document): boolean {
  return doc.querySelector(SELECTORS.ended) !== null;
}

export function getValidationButton(doc: Document): HTMLButtonElement | null {
  return doc.querySelector(SELECTORS.participateButton);
}

export function waitForElements<T extends Element>(
  doc: Document,
  selector: string,
  timeout: number = 5000
): Promise<NodeListOf<T> | null> {
  return new Promise((resolve) => {
    const element = doc.querySelectorAll(selector) as NodeListOf<T>;
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = doc.querySelectorAll(selector) as NodeListOf<T>;
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(doc, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}
