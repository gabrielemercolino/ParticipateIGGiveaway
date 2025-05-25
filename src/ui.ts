const UI_HTML = `__UI_HTML__`;
const UI_CSS = `__UI_CSS__`;

export type StatKey =
  | "participated"
  | "alreadyParticipated"
  | "notFound"
  | "ended"
  | "timeout"
  | "errors";

export type Stats = Record<StatKey, number>;

export function createGiveawayUI(
  options: { stats: Stats; total: number },
  onClose?: () => {}
) {
  document.body.innerHTML = document.body.innerHTML.concat(UI_HTML);

  const css = document.createElement("style");
  css.innerText = UI_CSS;
  document.head.appendChild(css);

  const total = document.querySelector(".stats > span") as HTMLSpanElement;
  total.innerText = `Total: ${options.total}`;

  function updateStat(key: StatKey, value: number) {
    let selector = `[data-${key}]`;

    const li = document.querySelector(selector);

    if (li) {
      const label = li.querySelector("span") as HTMLSpanElement;
      // Replace only the number at the end of the label, keeping the description intact
      label.textContent =
        label.textContent?.replace(/\d+$/, String(value)) ?? `${value}`;

      const bar = li.querySelector(".progress") as HTMLDivElement;
      bar.style.width = `${Math.min(100, (value / options.total) * 100)}%`;
    }
  }

  function onDone() {
    document.querySelector(".bottom")?.classList.remove("invisible");
    const closeButton = document.querySelector(
      ".bottom > button"
    ) as HTMLButtonElement;

    closeButton.onclick = () => {
      document.querySelector("#ig-overlay-root")?.remove();
      onClose?.();
    };
  }

  // exactly that iframe otherwise it could take another other one
  const iframe = document.querySelector(
    "#ig-overlay-iframe"
  ) as HTMLIFrameElement;

  return {
    iframe,
    updateStat,
    onDone,
  };
}
