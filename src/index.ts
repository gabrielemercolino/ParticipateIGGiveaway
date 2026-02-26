import { fetchGiveaways } from './giveaway/api';
import { processGiveaways, GiveawayResult } from './giveaway/controller';
import { StatsManager } from './giveaway/stats';
import { StatsUI } from './ui/ui';
import { logInfo, logError } from './utils/logger';

// Fetch links from backend when the script is loaded to save time later
logInfo('Fetching giveaway links...');
const giveaways = fetchGiveaways().then((giveawaysMap) =>
  Array.from(giveawaysMap.entries()).flatMap(([region, names]) =>
    names.map((name) => ({ region, name })),
  ),
);

GM.registerMenuCommand('Open giveaways', async () => {
  try {
    const ui = new StatsUI();
    const stats = new StatsManager(ui.updateDOM);
    logInfo('Overlay UI mounted');

    const allGiveaways = await giveaways;
    ui.removeWaitMessage();
    stats.set('total', allGiveaways.length);
    logInfo(`Found ${allGiveaways.length} giveaways to process.`, allGiveaways);

    const statusActions = {
      participated: () => {
        stats.increment('participated');
        logInfo('Participation completed');
      },
      alreadyParticipated: () => {
        stats.increment('alreadyParticipated');
        //logInfo("Already participated");
      },
      timeout: () => {
        stats.increment('timeout');
        logError('Timeout during participation');
      },
      error: (result: GiveawayResult) => {
        stats.increment('errors');
        const errorMsg =
          result.status === 'error' ? result.error.message : 'Unknown error';
        logError('Error:', errorMsg);
      },
    };

    await processGiveaways(
      allGiveaways.map(
        (g) => `https://www.instant-gaming.com/${g.region}/giveaway/${g.name}`,
      ),
      (result) => statusActions[result.status](result),
      2_000, // 2 seconds delay between giveaways
    );

    ui.enableCloseButton();
    logInfo(`Process completed. You can close the overlay.`);
    alert(`Process completed. You can close the overlay.`);

    // Handle click on Close
    const closeBtn = document.querySelector('#ig-overlay-root button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        ui.removeOverlay();
        logInfo('Overlay closed');
      });
    }
  } catch (e) {
    logError('Critical error:', e);
    alert(`Critical error: ${e instanceof Error ? e.message : String(e)}`);
    const closeBtn = document.querySelector(
      '#ig-overlay-root .bottom button',
    ) as HTMLButtonElement | null;
    if (closeBtn) closeBtn.disabled = false;
  }
});
