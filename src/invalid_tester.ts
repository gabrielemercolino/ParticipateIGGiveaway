import { GiveName, Region } from "./types";

import { getValidationButton, loadGiveaways, sleep } from "./utils";

type GiveawayTesterResult = Map<Region, GiveName[]>;

export class EndedGiveawayTester {
  async test(): Promise<GiveawayTesterResult> {
    const giveaways = await loadGiveaways();

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
        if (getValidationButton(doc) !== null) {
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
      await sleep(200); // to avoid spam
    }

    return result;
  }
}
