export const VERSION = GM.info.script.version;

export const GIVEAWAYS_REPO = `https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases/download/${VERSION}/giveaways.json`;

export const SELECTORS = {
  boostSection: ".participation-state.has-participation",
  boostButtons: ".button.reward:not(.success)",
  participateButton: "button.button.validate",
  _404: "span.e404",
  ended: ".giveaway-over",
};
