const UI_HTML: string = `__UI_HTML__`;
const UI_CSS: string = `__UI_CSS__`;

let overlayRoot: HTMLElement | null = null;
let iframe: HTMLIFrameElement | null = null;
let closeButton: HTMLButtonElement | null = null;

/**
 * Mounts the overlay UI on the page. Injects the CSS and HTML for the overlay if not already present.
 * Ensures only one overlay is mounted at a time.
 */
export function mountOverlay() {
  if (overlayRoot) return; // already mounted
  // Inject CSS as <style>
  if (!document.getElementById("ig-overlay-style")) {
    const style = document.createElement("style");
    style.id = "ig-overlay-style";
    style.textContent = UI_CSS;
    document.head.appendChild(style);
  }
  // Inject HTML
  const temp = document.createElement("div");
  temp.innerHTML = UI_HTML;
  overlayRoot = temp.firstElementChild as HTMLElement;
  document.body.appendChild(overlayRoot);
  iframe = overlayRoot.querySelector("iframe#ig-overlay-iframe");
  closeButton = overlayRoot.querySelector("button");
  if (closeButton) {
    closeButton.addEventListener("click", removeOverlay);
  }
}

/**
 * Updates the statistics and progress bars in the overlay UI.
 * @param stats - An object containing the current stats: total, participated, alreadyParticipated, timeout, errors
 */
export function updateStats(stats: {
  total: number;
  participated: number;
  alreadyParticipated: number;
  timeout: number;
  errors: number;
}) {
  if (!overlayRoot) return;
  overlayRoot.querySelector(
    ".stats > span"
  )!.textContent = `Total: ${stats.total}`;
  overlayRoot.querySelector(
    "li[data-participated] > span"
  )!.textContent = `Participated: ${stats.participated}`;
  overlayRoot.querySelector(
    "li[data-alreadyParticipated] > span"
  )!.textContent = `Already participated: ${stats.alreadyParticipated}`;
  overlayRoot.querySelector(
    "li[data-timeout] > span"
  )!.textContent = `Timeouts: ${stats.timeout}`;
  overlayRoot.querySelector(
    "li[data-errors] > span"
  )!.textContent = `Errors: ${stats.errors}`;

  // Update progress bars
  const setBar = (selector: string, value: number) => {
    const bar = overlayRoot!.querySelector(selector) as HTMLElement;
    if (bar)
      bar.style.width = stats.total ? `${(value / stats.total) * 100}%` : "0%";
  };
  setBar("li[data-participated] .progress", stats.participated);
  setBar("li[data-alreadyParticipated] .progress", stats.alreadyParticipated);
  setBar("li[data-timeout] .progress", stats.timeout);
  setBar("li[data-errors] .progress", stats.errors);
}

/**
 * Enables or disables the Close button in the overlay.
 * @param enabled - If true, enables the button; if false, disables it.
 */
export function setCloseEnabled(enabled: boolean) {
  if (closeButton) closeButton.disabled = !enabled;
}

/**
 * Removes the overlay UI from the page and cleans up references.
 */
export function removeOverlay() {
  if (overlayRoot) {
    overlayRoot.remove();
    overlayRoot = null;
    iframe = null;
    closeButton = null;
  }
  const style = document.getElementById("ig-overlay-style");
  if (style) style.remove();
}

/**
 * Returns the overlay's iframe element (for use by the controller).
 * @returns The iframe element, or null if not mounted.
 */
export function getIframe(): HTMLIFrameElement | null {
  return iframe;
}
