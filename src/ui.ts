export type StatKey =
  | "participated"
  | "alreadyParticipated"
  | "notFound"
  | "ended"
  | "timeout"
  | "errors";

export type Stats = Record<StatKey, number>;

export function createGiveawayUI(options: { stats: Stats; total: number }) {
  // Overlay root
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100dvw";
  overlay.style.height = "100dvh";
  overlay.style.background = "transparent";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "space-evenly";
  overlay.style.alignItems = "center";
  overlay.style.gap = "32px";

  // Left
  const iframeSection = document.createElement("div");
  iframeSection.style.width = "30dvw";
  iframeSection.style.height = "90dvh";
  iframeSection.style.background = "transparent";
  iframeSection.style.display = "flex";
  iframeSection.style.alignItems = "center";
  iframeSection.style.justifyContent = "center";

  const iframe = document.createElement("iframe");
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "2px solid var(--color, red)";
  iframeSection.appendChild(iframe);

  // Right
  const statsSection = document.createElement("div");
  statsSection.style.width = "30dvw";
  statsSection.style.height = "90dvh";
  statsSection.style.padding = "32px 24px";
  statsSection.style.display = "flex";
  statsSection.style.flexDirection = "column";
  statsSection.style.justifyContent = "space-between";
  statsSection.style.background = "var(--color-dark, #222)";
  statsSection.style.border = "2px solid var(--color, red)";

  const statsTitle = document.createElement("h2");
  statsTitle.textContent = "Participation Statistics";
  statsTitle.style.margin = "0 0 16px 0";
  statsSection.appendChild(statsTitle);

  const statsList = document.createElement("ul");
  statsList.style.listStyle = "none";
  statsList.style.padding = "0";
  statsList.style.margin = "0 0 24px 24px";
  statsList.style.display = "flex";
  statsList.style.flexDirection = "column";
  statsList.style.gap = "20px";
  statsList.style.alignItems = "flex-start";
  statsList.style.justifyContent = "space-evenly";

  statsList.innerHTML = "";

  // Total
  const totalLi = document.createElement("li");
  totalLi.style.width = "100%";
  totalLi.style.display = "flex";
  totalLi.style.flexDirection = "column";
  totalLi.style.gap = "4px";
  const totalLabel = document.createElement("span");
  totalLabel.textContent = `Total: ${options.total}`;
  totalLabel.style.fontWeight = "bold";
  totalLi.appendChild(totalLabel);
  statsList.appendChild(totalLi);

  // Separator
  const sep = document.createElement("hr");
  sep.style.width = "100%";
  sep.style.margin = "8px 0 12px 0";
  sep.style.border = "none";
  sep.style.borderTop = "1px solid #444";
  statsList.appendChild(sep);

  // Statistics
  (Object.keys(options.stats) as StatKey[]).forEach((key) => {
    const value = options.stats[key];
    const li = document.createElement("li");
    li.classList.add(`stat-${key}`);
    li.style.width = "100%";
    li.style.display = "flex";
    li.style.flexDirection = "column";
    li.style.gap = "4px";
    // Label
    const label = document.createElement("span");
    label.textContent = `${key}: ${value}`;
    li.appendChild(label);
    // Progress bar
    const progress = document.createElement("div");
    progress.style.height = "8px";
    progress.style.width = "100%";
    progress.style.background = "var(--color-medium, #333)";
    progress.style.borderRadius = "4px";
    progress.style.overflow = "hidden";
    const bar = document.createElement("div");
    bar.style.height = "100%";
    bar.style.width = `${Math.min(100, (value / options.total) * 100)}%`;
    bar.style.background = "#82df4d";
    if (["notFound", "timeout", "errors"].includes(key))
      bar.style.background = "#ff3235";
    bar.style.transition = "width 0.3s";
    progress.appendChild(bar);
    li.appendChild(progress);
    statsList.appendChild(li);
  });

  statsSection.appendChild(statsList);

  const endSection = document.createElement("div");
  endSection.style.display = "flex";
  endSection.style.alignItems = "center";
  endSection.style.width = "100%";
  endSection.style.justifyContent = "space-evenly";
  statsSection.appendChild(endSection);

  // Assemble UI
  overlay.appendChild(iframeSection);
  overlay.appendChild(statsSection);
  document.body.appendChild(overlay);

  function updateStat(key: StatKey, value: number) {
    const statElement = statsList.querySelector(`.stat-${key}`);
    if (statElement) {
      const label = statElement.querySelector("span");
      if (label) {
        label.textContent = `${key}: ${value}`;
      }
      const bar = statElement.querySelector("div > div") as HTMLDivElement;
      if (bar) {
        bar.style.width = `${Math.min(100, (value / options.total) * 100)}%`;
      }
    }
  }

  function onDone() {
    // End message
    const endMessage = document.createElement("span");
    endMessage.innerText = "Done. Check console for more details";
    endSection.appendChild(endMessage);

    // Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.style.alignSelf = "flex-end";
    closeButton.style.padding = "8px 16px";
    closeButton.style.background = "#e74c3c";
    closeButton.style.color = "#fff";
    closeButton.style.border = "none";
    closeButton.style.borderRadius = "4px";
    closeButton.style.cursor = "pointer";
    closeButton.onclick = () => {
      document.body.removeChild(overlay);
    };
    endSection.appendChild(closeButton);
  }

  return {
    iframe,
    updateStat,
    onDone,
  };
}
