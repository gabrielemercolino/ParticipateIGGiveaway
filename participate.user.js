// ==UserScript==
// @name         IG Auto Participate Giveaway
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      1.2.2
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        *://www.instant-gaming.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-idle
// @license      MIT
// @downloadURL  https://github.com/gabrielemercolino/ParticipateIGGiveaway/raw/main/participate.user.js
// @updateURL    https://github.com/gabrielemercolino/ParticipateIGGiveaway/raw/main/participate.user.js
// ==/UserScript==

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const button = document.querySelector("button.button.validate");
if (button == null) return;
button.click();
