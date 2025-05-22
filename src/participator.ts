import { VERSION, SELECTORS } from "./constants";
import { GiveName, Region } from "./types";

import {
  getValidationButton,
  isGiveaway404,
  isGiveawayEnded,
  loadGiveaways,
  sleep,
  waitForElements,
} from "./utils";

type GiveawayResult =
  | { status: "participated" }
  | { status: "already participated" }
  | { status: "ended" }
  | { status: "404" }
  | { status: "timeout" }
  | { status: "error"; message: string };

class Giveaway {
  private link: string;
  private iframe: HTMLIFrameElement;

  constructor(link: string, iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.link = link;
  }

  async participate(): Promise<GiveawayResult> {
    return new Promise<GiveawayResult>((resolve) => {
      this.iframe.src = this.link.toString();

      const timeout = setTimeout(() => {
        resolve({ status: "timeout" });
      }, 10000);

      this.iframe.onload = async () => {
        clearTimeout(timeout);
        // Check if the iframe is loaded
        if (this.iframe.contentWindow === null) {
          resolve({ status: "error", message: "Iframe not loaded" });
          return;
        }

        // Check if the giveaway page is loaded
        if (this.iframe.contentWindow.location.href !== this.link) {
          resolve({ status: "error", message: "Giveaway page not loaded" });
          return;
        }

        const doc = this.iframe.contentWindow.document;
        // Check if the giveaway page is 404
        if (isGiveaway404(doc)) {
          resolve({ status: "404" });
          return;
        }

        // Check if the giveaway page is ended
        if (isGiveawayEnded(doc)) {
          resolve({ status: "ended" });
          return;
        }

        // Override window.open to capture boost windows
        const defaultOpen = this.iframe.contentWindow.open;

        this.iframe.contentWindow.open = (...args) => {
          const newWindow = defaultOpen.apply(defaultOpen, args);
          if (newWindow) {
            newWindow.onload = () => {
              // Close the boost window
              newWindow.close();
            };
          }
          return newWindow;
        };

        // Look for the boost buttons that could have been missed by previous runs
        await this.clickBoostButtons(doc);

        // Look for the participate button
        const participateButton = getValidationButton(doc);

        if (!participateButton) {
          await sleep(200); // to avoid spam
          resolve({ status: "already participated" });
          return;
        }

        participateButton.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        participateButton.click();

        // now boost buttons should be visible
        await this.clickBoostButtons(doc);

        await sleep(1000); // to avoid spam

        resolve({ status: "participated" });
      };
    });
  }

  private async clickBoostButtons(doc: Document) {
    // Wait for the boost buttons to be visible
    const boostButtons = await waitForElements<
      HTMLAnchorElement | HTMLButtonElement
    >(doc, SELECTORS.boostButtons, 5000);

    if (boostButtons === null) return;

    for (const boostButton of boostButtons) {
      boostButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
      boostButton.click();
      await sleep(1000);
    }
  }
}

type GiveLog = Map<Region, GiveName[]>;

export class GiveawayManager {
  public participated: GiveLog = new Map();
  public participatedCount: number = 0;

  public alreadyParticipated: GiveLog = new Map();
  public alreadyParticipatedCount: number = 0;

  public ended: GiveLog = new Map();
  public endedCount: number = 0;

  public _404: GiveLog = new Map();
  public _404Count: number = 0;

  public timeout: GiveLog = new Map();
  public timeoutCount: number = 0;

  public errors: Map<Region, { name: GiveName; message: string }[]> = new Map();
  public errorsCount: number = 0;

  async run(): Promise<void> {
    // create iframe
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
    document.body.appendChild(iframe);

    const giveaways = await loadGiveaways();

    console.log("giveaways: ", giveaways);

    for (const [region, names] of giveaways.entries()) {
      if (region === "ended") continue;
      for (const name of names) {
        const giveaway = new Giveaway(
          `https://www.instant-gaming.com/${region}/giveaway/${name}`,
          iframe
        );

        const result = await giveaway.participate();

        switch (result.status) {
          case "participated":
            this.participatedCount++;
            const participated = this.participated.get(region) ?? [];
            participated.push(name);
            this.participated.set(region, participated);
            break;

          case "already participated":
            this.alreadyParticipatedCount++;
            const alreadyParticipated =
              this.alreadyParticipated.get(region) ?? [];
            alreadyParticipated.push(name);
            this.alreadyParticipated.set(region, alreadyParticipated);
            break;

          case "404":
            this._404Count++;
            const _404 = this._404.get(region) ?? [];
            _404.push(name);
            this._404.set(region, _404);
            break;

          case "ended":
            this.endedCount++;
            const ended = this.ended.get(region) ?? [];
            ended.push(name);
            this.ended.set(region, ended);
            break;

          case "timeout":
            this.timeoutCount++;
            const timeout = this.timeout.get(region) ?? [];
            timeout.push(name);
            this.timeout.set(region, timeout);
            break;

          case "error":
            this.errorsCount++;
            const errors = this.errors.get(region) ?? [];
            errors.push({ name, message: result.message });
            this.errors.set(region, errors);
            break;
        }
      }
    }

    const total: number =
      this.participatedCount+
      this.alreadyParticipatedCount +
      this._404Count +
      this.endedCount +
      this.timeoutCount +
      this.errorsCount;

    alert(
      `ParticipateIGGiveaway v${VERSION}
      Total: ${total}
      Participated: ${this.participatedCount}
      Already participated: ${this.alreadyParticipatedCount}
      404: ${this._404Count}
      Ended: ${this.endedCount}
      Timeout: ${this.timeoutCount}
      Errors: ${this.errorsCount}
      Check console for more details`
    );

    console.log("Participated: ", this.participated);
    console.log("Already participated: ", this.alreadyParticipated);
    console.log("404: ", this._404);
    console.log("Ended: ", this.ended);
    console.log("Timeout: ", this.timeout);
    console.log("Errors: ", this.errors);

    // remove iframe
    await sleep(2000);
    iframe.remove();
  }
}
