import { GiveawayTester } from "./invalid_tester";
import { GiveawayManager } from "./participator";

GM.registerMenuCommand("Open giveaways", async () => {
  const manager = new GiveawayManager();
  await manager.run();
});

GM.registerMenuCommand("Check ended giveaways", async () => {
  const reopened = await new GiveawayTester().checkEnded();

  if (reopened.entries.length === 0) {
    alert("Ended giveaways are still ended.");
  } else {
    alert("Some giveaways are now valid\nCheck console for more details\n");

    console.log("Valid giveaways:", reopened);
  }
});

GM.registerMenuCommand("Check invalid giveaways", async () => {
  const invalids = await new GiveawayTester().checkForInvalids();

  if (invalids.ended.size !== 0) {
    alert("Some giveaways are ended\nCheck console for more details\n");
    console.log("Ended giveaways:", invalids.ended);
  } else {
    alert("No giveaways are ended");
  }

  if (invalids._404.size !== 0) {
    alert("Some giveaways are 404\nCheck console for more details\n");
    console.log("404 giveaways:", invalids._404);
  } else {
    alert("No giveaways are 404");
  }
});
