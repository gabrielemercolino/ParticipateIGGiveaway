import { checkEnded, checkForInvalids } from "./invalid_tester";
import {
  participateGiveaways,
  ParticipationError,
  ParticipationUpdate,
} from "./participator";
import { calculateTotal, giveaways } from "./utils";

type CategoryData = {
  count: number;
  gives: Map<string, string[]>;
};

const categories = [
  "participated",
  "alreadyParticipated",
  "notFound",
  "ended",
  "timeout",
] as const;

type Category = (typeof categories)[number];

GM.registerMenuCommand("Open giveaways", async () => {
  const data = Object.fromEntries(
    categories.map((cat) => [cat, { count: 0, gives: new Map() }])
  ) as Record<Category, CategoryData>;

  const errors: {
    count: number;
    errors: Map<string, { name: string; message: string }>;
  } = {
    count: 0,
    errors: new Map(),
  };

  const gives = await giveaways();
  const total = calculateTotal(gives);

  const updateHandler = (event: ParticipationUpdate) => {
    switch (event.status) {
      case "participated":
        updateLog(event, data.participated);
        break;
      case "already participated":
        updateLog(event, data.alreadyParticipated);
        break;
      case "ended":
        updateLog(event, data.ended);
        break;
      case "404":
        updateLog(event, data.notFound);
        break;
      case "timeout":
        updateLog(event, data.timeout);
        break;
    }
  };

  const errorHandler = (error: ParticipationError) => {
    errors.count++;
    errors.errors.set(error.name, error);
  };

  await participateGiveaways(gives, updateHandler, errorHandler);

  showResult(total, data, errors);
});

GM.registerMenuCommand("Check ended giveaways", async () => {
  const reopened = await checkEnded();

  if (reopened.entries.length === 0) {
    alert("Ended giveaways are still ended.");
  } else {
    alert("Some giveaways are now valid\nCheck console for more details\n");

    console.log("Valid giveaways:", reopened);
  }
});

GM.registerMenuCommand("Check invalid giveaways", async () => {
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
});

function showResult(
  total: number,
  data: Record<Category, CategoryData>,
  errors: {
    count: number;
    errors: Map<string, { name: string; message: string }>;
  }
) {
  alert(`
    ParticipateIGGiveaway v${GM.info.script.version}
    ----------------------------------------
    Total: ${total}
    Participated: ${data.participated.count}
    Already participated: ${data.alreadyParticipated.count}
    404: ${data.notFound.count}
    Ended: ${data.ended.count}
    Timeout: ${data.timeout.count}
    Errors: ${errors.count}
    ----------------------------------------
    Check console for more details
  `);

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
