// ==UserScript==
// @name         IG Auto Open and Participate Giveaway
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      4.0.0
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

  export function getValidationButton(doc: Document): HTMLButtonElement | null {
    return doc.querySelector("button.button.validate");
  }

  export function getBoostsButtons(
    doc: Document
  ): NodeListOf<HTMLButtonElement | HTMLAnchorElement> {
    return doc.querySelectorAll("a.button.reward.alerts");
  }
}

type GiveawayResult =
  | { status: "participated" }
  | { status: "already participated" }
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
        if (this.iframe.contentWindow.location.href !== this.link.toString()) {
          resolve({ status: "error", message: "Giveaway page not loaded" });
          return;
        }

        const doc = this.iframe.contentWindow.document;
        // Check if the giveaway page is 404
        if (Utils.isGiveaway404(doc)) {
          resolve({ status: "404" });
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
        let hasBoosts = false;
        const boostButtons = Utils.getBoostsButtons(doc);
        for (const boostButton of boostButtons) {
          hasBoosts = true;
          boostButton.click();
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

        participateButton.click();
        await Utils.sleep(1000); // to avoid spam

        // Wait for boosts to activate if necessary
        if (hasBoosts) await Utils.sleep(2000); // wait for boosts to activate

        resolve({ status: "participated" });
      };
    });
  }
}

class GiveawayManager {
  public participated: number = 0;
  public alreadyParticipated: number = 0;
  public invalid: number = 0;

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
      if (region === "invalids") continue;
      for (const name of names) {
        console.log(`give: ${name} (${region})`);

        const giveaway = new Giveaway(
          `https://www.instant-gaming.com/${region}/giveaway/${name}`,
          iframe
        );

        const result = await giveaway.participate();

        switch (result.status) {
          case "participated":
            this.participated++;
            console.log(`Participated: ${name}`);
            break;
          case "already participated":
            this.alreadyParticipated++;
            console.log(`Already participated: ${name}`);
            break;
          case "404":
            this.invalid++;
            console.log(`Giveaway invalid: ${name}`);
            break;
          case "timeout":
            this.invalid++;
            console.log(`Timeout: ${name}`);
            break;
          case "error":
            console.error(`"Error: ${result.message}`);
            this.invalid++;
            break;
        }
      }
    }

    const total: number =
      this.participated + this.alreadyParticipated + this.invalid;

    alert(
      `ParticipateIGGiveaway v${VERSION}\n` +
        `Total: ${total}\n` +
        `Participated: ${this.participated}\n` +
        `Already participated: ${this.alreadyParticipated}\n` +
        `Invalid: ${this.invalid}\n`
    );

    // remove iframe
    await Utils.sleep(2000);
    iframe.remove();
  }
}

GM.registerMenuCommand("Open giveaways", async () => {
  const manager = new GiveawayManager();
  await manager.run();
});

type GiveawayInvalidTesterResult = Map<Region, GiveName[]>;

class GiveawayInvalidTester {
  async test(): Promise<GiveawayInvalidTesterResult> {
    const giveaways = await Utils.loadGiveaways();

    const invalids = giveaways.get("invalids") ?? [];

    let result: GiveawayInvalidTesterResult = new Map();

    // regions ordered by likelihood of being valid
    // to avoid opening too many windows if not necessary
    const regions = ["en", "it", "fr", "es", "de", "pl", "pt"];

    for (const name of invalids) {
      console.log(`Testing giveaway: ${name}`);

      for (const region of regions) {
        const url = `https://www.instant-gaming.com/${region}/giveaway/${name}`;

        const response = await GM.xmlHttpRequest({
          method: "GET",
          url: url,
          headers: { "Content-Type": "text/html" },
        });

        const doc = new DOMParser().parseFromString(
          response.responseText,
          "text/html"
        );

        if (Utils.getValidationButton(doc) !== null) {
          console.log(`  ${region}: OK`);
          const gives = result.get(region) ?? [];
          gives.push(name);
          result.set(region, gives);
          break; // No need to check other regions
        } else {
          console.log(`  ${region}: NO`);
        }
      }

      await Utils.sleep(500); // to avoid spam
    }

    return result;
  }
}

GM.registerMenuCommand("Test invalid giveaways", async () => {
  const tester = new GiveawayInvalidTester();

  const result = await tester.test();

  if (result.entries.length === 0) {
    alert("Invalid giveaways are still invalid.");
  } else {
    alert("Some giveaways are now valid\nCheck console for more details\n");

    console.log("Valid giveaways:", result);
  }
});
