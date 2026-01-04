import { fetchGiveaways } from "./giveaway/api";
import { processGiveaways, GiveawayResult } from "./giveaway/controller";
import { StatsManager } from "./giveaway/stats";
import {
  mountOverlay,
  updateStats,
  setCloseEnabled,
  removeOverlay,
  removeServerWaitMessage,
} from "./ui/ui";
import { logInfo, logError } from "./utils/logger";

// Fetch links from backend when the script is loaded to save time later
logInfo("Fetching giveaway links...");
const giveaways = fetchGiveaways().then((giveawaysMap) =>
  Array.from(giveawaysMap.entries()).flatMap(([region, names]) =>
    names.map((name) => ({ region, name }))
  )
);

GM.registerMenuCommand("Open giveaways", async () => {
  try {
    mountOverlay();
    logInfo("Overlay UI mounted");

    // Fetch links from backend
    logInfo("Fetching giveaway links...");
    const allGiveaways = await giveaways;
    removeServerWaitMessage();
    logInfo(`Found ${allGiveaways.length} giveaways to process.`, allGiveaways);
    const stats = new StatsManager(allGiveaways.length);
    stats.onChange(updateStats);
    updateStats(stats.getStats());

    // Close button management
    setCloseEnabled(false);

    const statusActions = {
      participated: () => {
        stats.incrementParticipated();
        logInfo("Participation completed");
      },
      already_participated: () => {
        stats.incrementAlreadyParticipated();
        //logInfo("Already participated");
      },
      timeout: () => {
        stats.incrementTimeout();
        logError("Timeout during participation");
      },
      error: (result: GiveawayResult) => {
        stats.incrementErrors();
        logError("Error:", (result as any)?.error ?? "Unknown error");
      },
    };

    // Adapt processGiveaways to accept {region, name} objects and build the URL only when used
    await processGiveaways(
      allGiveaways.map(
        (g) => `https://www.instant-gaming.com/${g.region}/giveaway/${g.name}`
      ),
      (result) => statusActions[result.status]?.(result),
      2_000 // 2 seconds delay between giveaways
    );

    setCloseEnabled(true);
    logInfo(`Process completed. You can close the overlay.`);
    alert(`Process completed. You can close the overlay.`);

    // Handle click on Close
    const closeBtn = document.querySelector("#ig-overlay-root button");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        removeOverlay();
        logInfo("Overlay closed");
      });
    }
  } catch (e) {
    logError("Critical error:", e);
    alert(`Critical error: ${e instanceof Error ? e.message : String(e)}`);
    setCloseEnabled(true);
  }
});
