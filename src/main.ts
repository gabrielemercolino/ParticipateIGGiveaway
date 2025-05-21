// ==UserScript==
// @name         IG Auto Open and Participate Giveaway
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      4.2.0
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        https://www.instant-gaming.com/*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @run-at       document-idle
// @noframes
// @license      MIT
// @downloadURL  https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases/latest/download/giveaways.user.js
// @updateURL    https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases/latest/download/giveaways.user.js
// ==/UserScript==

type GiveName = string;
type Region = string;
type Gives = Map<Region, GiveName[]>;

const VERSION = GM.info.script.version;

const GIVEAWAYS_REPO = `https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases/download/${VERSION}/giveaways.json`;

namespace Utils {
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
    return doc.querySelector("span.e404") !== null;
  }

  export function isGiveawayEnded(doc: Document): boolean {
    return doc.querySelector(".giveaway-over") !== null;
  }

  export function getValidationButton(doc: Document): HTMLButtonElement | null {
    return doc.querySelector("button.button.validate");
  }

  export function getBoostsButtons(
    doc: Document
  ): NodeListOf<HTMLButtonElement | HTMLAnchorElement> {
    return doc.querySelectorAll("a.button.reward.alerts:not(.success)");
  }
}

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
        if (Utils.isGiveaway404(doc)) {
          resolve({ status: "404" });
          return;
        }

        // Check if the giveaway page is ended
        if (Utils.isGiveawayEnded(doc)) {
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

        // Look for the boost buttons
        const boostButtons = Utils.getBoostsButtons(doc);
        for (const boostButton of boostButtons) {
          boostButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
          boostButton.click();
          await Utils.sleep(1000);
        }

        // Reset the open function
        this.iframe.contentWindow.open = defaultOpen;

        // Look for the participate button
        const participateButton = Utils.getValidationButton(doc);

        if (!participateButton) {
          await Utils.sleep(1000); // to avoid spam
          resolve({ status: "already participated" });
          return;
        }

        participateButton.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        participateButton.click();
        await Utils.sleep(1000); // to avoid spam

        resolve({ status: "participated" });
      };
    });
  }
}

type GiveLog = {
  name: GiveName;
  region: Region;
};

class GiveawayManager {
  public participated: GiveLog[] = [];
  public alreadyParticipated: GiveLog[] = [];
  public ended: GiveLog[] = [];
  public _404: GiveLog[] = [];
  public timeout: GiveLog[] = [];
  public errors: { name: GiveName; region: Region; message: string }[] = [];

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

    const giveaways = await Utils.loadGiveaways();

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
            this.participated.push({ name, region });
            break;

          case "already participated":
            this.alreadyParticipated.push({ name, region });
            break;

          case "404":
            this._404.push({ name, region });
            break;

          case "ended":
            this.ended.push({ name, region });
            break;

          case "timeout":
            this.timeout.push({ name, region });
            break;

          case "error":
            this.errors.push({ name, region, message: result.message });
            break;
        }
      }
    }

    const total: number =
      this.participated.length +
      this.alreadyParticipated.length +
      this._404.length +
      this.ended.length +
      this.timeout.length +
      this.errors.length;

    alert(
      `ParticipateIGGiveaway v${VERSION}\n` +
        `Total: ${total}\n` +
        `Participated: ${this.participated.length}\n` +
        `Already participated: ${this.alreadyParticipated.length}\n` +
        `404: ${this._404.length}\n` +
        `Ended: ${this.ended.length}\n` +
        `Timeout: ${this.timeout.length}\n` +
        `Errors: ${this.errors.length}\n` +
        `Check console for more details`
    );

    console.log("Participated: ", this.participated);
    console.log("Already participated: ", this.alreadyParticipated);
    console.log("404: ", this._404);
    console.log("Ended: ", this.ended);
    console.log("Timeout: ", this.timeout);
    console.log("Errors: ", this.errors);

    // remove iframe
    await Utils.sleep(2000);
    iframe.remove();
  }
}

GM.registerMenuCommand("Open giveaways", async () => {
  const manager = new GiveawayManager();
  await manager.run();
});

type GiveawayTesterResult = Map<Region, GiveName[]>;

class EndedGiveawayTester {
  async test(): Promise<GiveawayTesterResult> {
    const giveaways = await Utils.loadGiveaways();

    const ended = giveaways.get("ended") ?? [];

    let result: GiveawayTesterResult = new Map();

    // regions ordered by likelihood of being valid
    // to avoid opening too many windows if not necessary
    const regions = ["en", "it", "fr", "es", "de", "pl", "pt"];

    for (const name of ended) {
      // Parallelize region requests for every giveaway
      const checks = regions.map(async (region) => {
        const url = `https://www.instant-gaming.com/${region}/giveaway/${name}`;
        const response = await GM.xmlHttpRequest({
          method: "GET",
          url: url,
          headers: { "Content-Type": "text/html" },
        });
        const doc = new DOMParser().parseFromString(
          response.responseText ?? response.response,
          "text/html"
        );
        if (Utils.getValidationButton(doc) !== null) {
          return { region, valid: true };
        }
        return { region, valid: false };
      });

      const results = await Promise.all(checks);
      const found = results.find((r) => r.valid);

      if (found) {
        console.log(`The giveaway ${name} is valid in ${found.region}`);
        const gives = result.get(found.region) ?? [];
        gives.push(name);
        result.set(found.region, gives);
      } else {
        console.log(`NO region validates the giveaway ${name}`);
      }
      await Utils.sleep(200); // to avoid spam
    }

    return result;
  }
}

GM.registerMenuCommand("Test ended giveaways", async () => {
  const result = await new EndedGiveawayTester().test();

  if (result.entries.length === 0) {
    alert("Ended giveaways are still ended.");
  } else {
    alert("Some giveaways are now valid\nCheck console for more details\n");

    console.log("Valid giveaways:", result);
  }
});
