const UI_HTML: string = `__UI_HTML__`;
const UI_CSS: string = `__UI_CSS__`;

const $ = (selector: string) => document.querySelector(selector);

export class StatsUI {
  constructor() {
    this.insertHTML();
  }

  insertHTML() {
    // Inject CSS as <style>
    if (!$("#ig-overlay-style")) {
      const style = document.createElement("style");
      style.id = "ig-overlay-style";
      style.textContent = UI_CSS;
      document.head.appendChild(style);
    }
    // Inject HTML
    document.body.insertAdjacentHTML("beforeend", UI_HTML);
  }

  updateDOM = (prop: string, value: number, total: number) => {
    if (prop === "total")
      $("#ig-overlay-root .stats > span")!.textContent = `Total: ${value}`;
    else {
      const label = $(`#ig-overlay-root li[data-${prop}] > span`)!;
      label.textContent = `${this.getLabelFor(prop)}: ${value}`;
      const bar = $(
        `#ig-overlay-root li[data-${prop}] .progress`
      ) as HTMLDivElement;
      bar.style.width = `${(value / total) * 100}%`;
    }
  };

  removeWaitMessage() {
    const waitMessage = $("#ig-overlay-root .wait-for-server");
    if (waitMessage) waitMessage.remove();
  }

  enableCloseButton() {
    const btn = $("#ig-overlay-root .bottom button") as HTMLButtonElement;
    if (btn) btn.disabled = false;
  }

  removeOverlay = () => {
    const overlay = $("#ig-overlay-root");
    if (overlay) overlay.remove();
  };

  getLabelFor(prop: string): string {
    switch (prop) {
      case "participated":
        return "Participated";
      case "alreadyParticipated":
        return "Already participated";
      case "timeout":
        return "Timeouts";
      case "errors":
        return "Errors";
      default:
        return prop;
    }
  }
}
