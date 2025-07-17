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

  alert("Check console for more details\n");
  console.log("Valid giveaways:", reopened);

  checkingEnded = false;
});

let checkingInvalid = false;
GM.registerMenuCommand("Check invalid giveaways", async () => {
  if (checkingInvalid) return;

  checkingInvalid = true;
  const invalids = await checkForInvalids();

  alert("Check console for more details\n");

  console.log("Ended giveaways:", invalids.ended);
  console.log("404 giveaways:", invalids.notFound);

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
