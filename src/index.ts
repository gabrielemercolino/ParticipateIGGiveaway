import { checkEnded, checkForInvalids } from "./invalid_tester";
import {
  participateGiveaways,
  ParticipationError,
  ParticipationUpdate,
} from "./participator";
import { createGiveawayUI, StatKey } from "./ui";
import { calculateTotal, giveaways } from "./utils";

type CategoryData = {
  count: number;
  gives: Map<string, string[]>;
};

const categories: StatKey[] = [
  "participated",
  "alreadyParticipated",
  "notFound",
  "ended",
  "timeout",
  "errors",
];

let opening = false;

GM.registerMenuCommand("Open giveaways", async () => {
  if (opening) return;

  opening = true;
  const stats = Object.fromEntries(
    categories.map((cat) => [cat, { count: 0, gives: new Map() }])
  ) as Record<StatKey, CategoryData>;

  const errors: {
    count: number;
    errors: Map<string, { name: string; message: string }>;
  } = {
    count: 0,
    errors: new Map(),
  };

  const gives = await giveaways();
  const total = calculateTotal(gives);

  const { iframe, updateStat, onDone } = createGiveawayUI(
    {
      stats: {
        participated: 0,
        alreadyParticipated: 0,
        ended: 0,
        notFound: 0,
        timeout: 0,
        errors: 0,
      },
      total,
    },
    () => (opening = false)
  );

  const updateHandler = (event: ParticipationUpdate) => {
    switch (event.status) {
      case "participated":
        updateLog(event, stats.participated);
        updateStat("participated", stats.participated.count);
        break;
      case "already participated":
        updateLog(event, stats.alreadyParticipated);
        updateStat("alreadyParticipated", stats.alreadyParticipated.count);
        break;
      case "ended":
        updateLog(event, stats.ended);
        updateStat("ended", stats.ended.count);
        break;
      case "404":
        updateLog(event, stats.notFound);
        updateStat("notFound", stats.notFound.count);
        break;
      case "timeout":
        updateLog(event, stats.timeout);
        updateStat("timeout", stats.timeout.count);
        break;
    }
  };

  const errorHandler = (error: ParticipationError) => {
    errors.count++;
    errors.errors.set(error.name, error);
  };

  await participateGiveaways(iframe, gives, updateHandler, errorHandler);
  onDone();

  logStats(total, stats, errors);
});

let checkingEnded = false;
GM.registerMenuCommand("Check ended giveaways", async () => {
  if (checkingEnded) return;

  checkingEnded = true;
  const reopened = await checkEnded();

  if (reopened.entries.length === 0) {
    alert("Ended giveaways are still ended.");
  } else {
    alert("Some giveaways are now valid\nCheck console for more details\n");

    console.log("Valid giveaways:", reopened);
  }

  checkingEnded = false;
});

let checkingInvalid = false;
GM.registerMenuCommand("Check invalid giveaways", async () => {
  if (checkingInvalid) return;

  checkingInvalid = true;
  const invalids = await checkForInvalids();

  if (invalids.ended.size !== 0) {
    alert("Some giveaways are ended\nCheck console for more details\n");
    console.log("Ended giveaways:", invalids.ended);
  } else {
    alert("No giveaways are ended");
  }

  if (invalids.notFound.size !== 0) {
    alert("Some giveaways are 404\nCheck console for more details\n");
    console.log("404 giveaways:", invalids.notFound);
  } else {
    alert("No giveaways are 404");
  }

  checkingInvalid = false;
});

function logStats(
  total: number,
  data: Record<StatKey, CategoryData>,
  errors: {
    count: number;
    errors: Map<string, { name: string; message: string }>;
  }
) {
  console.log("Total: ", total);
  console.log("Participated: ", data.participated.gives);
  console.log("Already participated: ", data.alreadyParticipated.gives);
  console.log("404: ", data.notFound.gives);
  console.log("Ended: ", data.ended.gives);
  console.log("Timeout: ", data.timeout.gives);
  console.log("Errors: ", errors.errors);
}

function updateLog(event: ParticipationUpdate, log: CategoryData) {
  const regional = log.gives.get(event.region) || [];
  regional.push(event.name);
  log.gives.set(event.region, regional);
  log.count++;
}
