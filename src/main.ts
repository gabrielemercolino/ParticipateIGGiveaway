// ==UserScript==
// @name         IG Auto Open and Participate Giveaway
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      3.0.1
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        https://www.instant-gaming.com/*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @run-at       document-idle
// @noframes
// @license      MIT
// @downloadURL  https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases/latest/download/giveaways.user.js
// @updateURL    https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases/latest/download/giveaways.user.js
// ==/UserScript==

type GiveName = string;
type Region = string;
type Gives = Map<Region, GiveName[]>;

const VERSION = GM.info.script.version;

const GIVEAWAYS_REPO = `https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases/download/${VERSION}/giveaways.json`;

namespace Utils {
	export async function sleep(time_ms: number): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, time_ms));
	}

	export function openWindowInNewTab(url: URL): Window {
		const newWindow = window.open(url.toString(), "_blank");

		if (newWindow == null) throw new Error("Failed to open new window");

		return newWindow;
	}

	export async function loadGiveaways(): Promise<Gives> {
		try {
			const response = await GM.xmlHttpRequest({
				method: "GET",
				url: GIVEAWAYS_REPO,
				headers: { "Content-Type": "application/json" },
			});

			// Tampermonkey has `response.responseText` but Greasemonkey has `response.response`
			const text = response.responseText ?? response.response;

			const obj = JSON.parse(text);
			return new Map(Object.entries(obj));
		} catch (error) {
			console.error("Errore durante il caricamento dei giveaway:", error);
			throw new Error("Impossibile caricare i giveaway");
		}
	}

	export function isGiveaway404(doc: Document): boolean {
		return doc.querySelector("span.e404") !== null;
	}

	export function getValidationButton(doc: Document): HTMLButtonElement | null {
		return doc.querySelector("button.button.validate");
	}

	export function getBoostsButtons(
		doc: Document
	): NodeListOf<HTMLButtonElement | HTMLAnchorElement> {
		return doc.querySelectorAll("a.button.reward.alerts");
	}
}

type GiveawayResult =
	| { status: "participated" }
	| { status: "already participated" }
	| { status: "404" }
	| { status: "timeout" }
	| { status: "error"; message: string };

class Giveaway {
	private link: URL;

	constructor(link: URL) {
		this.link = link;
	}

	async participate(): Promise<GiveawayResult> {
		return new Promise<GiveawayResult>((resolve, reject) => {
			let giveawayWindow = Utils.openWindowInNewTab(this.link);

			if (!giveawayWindow) {
				resolve({ status: "error", message: "Cannot open giveaway window" });
				return;
			}

			// Override window.open to capture boost windows
			const originalOpen = giveawayWindow.open;
			giveawayWindow.open = function (...args) {
				const w = originalOpen.apply(this, args);
				if (w) w.onload = () => w.close();
				return w;
			};

			// 10 seconds timeout for closing the
			// giveaway page if something goes wrong
			const timeout = setTimeout(() => {
				giveawayWindow.close();
				resolve({ status: "timeout" });
			}, 10000);

			// Handle giveaway window load
			giveawayWindow.onload = async () => {
				clearTimeout(timeout);

				try {
					const doc = giveawayWindow.document;

					// Check if the giveaway page is 404
					if (Utils.isGiveaway404(doc)) {
						resolve({ status: "404" });
						return;
					}

					// Find and click boost buttons
					let hasBoosts = false;
					const boostButtons = Utils.getBoostsButtons(doc);
					for (const boostButton of boostButtons) {
						hasBoosts = true;
						boostButton.click();
					}

					// Find and click participate button
					const participateButton = Utils.getValidationButton(doc);
					if (!participateButton) {
						await Utils.sleep(500); // to avoid spam
						giveawayWindow.close();
						resolve({ status: "already participated" });
						return;
					}

					participateButton.click();
					await Utils.sleep(500); // to avoid spam

					// Wait for boosts to activate if necessary
					if (hasBoosts) await Utils.sleep(2000);

					// Close the giveaway window
					giveawayWindow.close();
					resolve({ status: "participated" });
				} catch (error) {
					giveawayWindow.close();
					resolve({
						status: "error",
						message: error instanceof Error ? error.message : "Unknown error",
					});
				}
			};
		});
	}
}

class GiveawayManager {
	public participated: number = 0;
	public alreadyParticipated: number = 0;
	public invalid: number = 0;

	async run(debug: boolean = false): Promise<void> {
		const giveaways = await Utils.loadGiveaways();

		if (debug) console.log("giveaways: ", giveaways);

		for (const [region, names] of giveaways.entries()) {
			if (region === "invalids") continue;
			for (const name of names) {
				if (debug) console.log(`give: ${name} (${region})`);
				const url = new URL(
					`https://www.instant-gaming.com/${region}/giveaway/${name}`
				);
				const giveaway = new Giveaway(url);
				const result = await giveaway.participate();

				switch (result.status) {
					case "participated":
						this.participated++;
						if (debug) console.log("Participated:", name);
						break;
					case "already participated":
						this.alreadyParticipated++;
						if (debug) console.log("Already participated:", name);
						break;
					case "404":
						this.invalid++;
						if (debug) console.log("Giveaway not found:", name);
						break;
					case "timeout":
						this.invalid++;
						if (debug) console.log("Timeout:", name);
						break;
					case "error":
						if (debug) console.error("Error:", result.message);
						this.invalid++;
						break;
				}
			}
		}

		const total: number =
			this.participated + this.alreadyParticipated + this.invalid;

		alert(
			`ParticipateIGGiveaway v${VERSION}\n` +
				`Total: ${total}\n` +
				`Participated: ${this.participated}\n` +
				`Already participated: ${this.alreadyParticipated}\n` +
				`Invalid: ${this.invalid}\n`
		);
	}
}

GM.registerMenuCommand("Open giveaways", async () => {
	const manager = new GiveawayManager();
	await manager.run();
});

GM.registerMenuCommand("Open giveaways [DEBUG]", async () => {
	const manager = new GiveawayManager();
	await manager.run(true);
});

type GiveawayInvalidTesterResult = { name: GiveName; region: Region }[];

class GiveawayInvalidTester {
	async test(): Promise<GiveawayInvalidTesterResult> {
		const giveaways = await Utils.loadGiveaways();
		const invalids = giveaways.get("invalids") ?? [];

		let result: GiveawayInvalidTesterResult = [];

		const regions = ["en", "it", "fr", "es", "de", "pl", "pt"];

		for (const name of invalids) {
			for (const region of regions) {
				const url = new URL(
					`https://www.instant-gaming.com/${region}/giveaway/${name}`
				);
				const testWindow = Utils.openWindowInNewTab(url);
				if (!testWindow) continue;

				const giveawayValid = await new Promise<boolean>((resolve) => {
					testWindow.onload = () => {
						const testDoc = testWindow.document;

						if (
							!Utils.isGiveaway404(testDoc) &&
							Utils.getValidationButton(testDoc) !== null
						) {
							result.push({ name, region });
							resolve(true);
						} else {
							resolve(false);
						}

						testWindow.close();
					};
				});

				if (giveawayValid) break; // No need to check other regions
			}
		}

		return result;
	}
}

GM.registerMenuCommand("Test invalid giveaways", async () => {
	const tester = new GiveawayInvalidTester();
	const result = await tester.test();

	if (result.length === 0) {
		alert("Invalid giveaways are still invalid.");
	} else {
		alert("Some giveaways are now valid\nCheck console for more details\n");
		console.log("Valid giveaways:", result);
	}
});
