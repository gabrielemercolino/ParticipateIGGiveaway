// ==UserScript==
// @name         IG Auto Open and Participate Giveaway
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      3.0.0
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        https://www.instant-gaming.com/*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @run-at       document-idle
// @noframes
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.user.js
// @updateURL    https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.user.js
// ==/UserScript==

namespace Utils {
	export async function sleep(time_ms: number): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, time_ms));
	}

	export function openWindowInNewTab(url: URL): Window {
		const newWindow = window.open(url.toString(), "_blank");

		if (newWindow == null) throw new Error("Failed to open new window");

		return newWindow;
	}
}
