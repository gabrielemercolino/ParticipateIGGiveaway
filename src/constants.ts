export const VERSION = GM.info.script.version;

export const GIVEAWAYS_REPO = `https://ig-giveaway-server.onrender.com/api/getActiveGives`;

export const SELECTORS = {
  boostSection: ".participation-state.has-participation",
  boostButtons: ".button.reward:not(.success)",
  participateButton: "button.button.validate",
} as const;
