import { EndedGiveawayTester } from "./invalid_tester";
import { GiveawayManager } from "./participator";

GM.registerMenuCommand("Open giveaways", async () => {
  const manager = new GiveawayManager();
  await manager.run();
});

GM.registerMenuCommand("Test ended giveaways", async () => {
  const result = await new EndedGiveawayTester().test();

  if (result.entries.length === 0) {
    alert("Ended giveaways are still ended.");
  } else {
    alert("Some giveaways are now valid\nCheck console for more details\n");

    console.log("Valid giveaways:", result);
  }
});
