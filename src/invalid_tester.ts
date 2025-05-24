import {
  getValidationButton,
  isGiveaway404,
  isGiveawayEnded,
  giveaways,
  sleep,
} from "./utils";

export async function checkEnded(): Promise<Map<string, string[]>> {
  const gives = await giveaways();
  const ended = gives.get("ended") ?? [];
  let result = new Map();

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

      if (getValidationButton(doc) !== null) return { region, valid: true };

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

export async function checkForInvalids(): Promise<{
  ended: Map<string, string[]>;
  notFound: Map<string, string[]>;
}> {
  const gives = await giveaways();
  const result = { ended: new Map(), notFound: new Map() };

  for (const [region, names] of gives.entries()) {
    if (region === "ended") continue;

    for (const name of names) {
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

      if (isGiveaway404(doc)) {
        console.log(`The giveaway ${name} is 404 in ${region}`);
        const notFound = result.notFound.get(region) ?? [];
        notFound.push(name);
        result.notFound.set(region, notFound);
      } else if (isGiveawayEnded(doc)) {
        console.log(`The giveaway ${name} has ended in ${region}`);
        const ended = result.ended.get(region) ?? [];
        ended.push(name);
        result.ended.set(region, ended);
      } else {
        console.log(`The giveaway ${name} is still valid in ${region}`);
      }

      await sleep(200); // to avoid spam
    }
  }
  return result;
}
