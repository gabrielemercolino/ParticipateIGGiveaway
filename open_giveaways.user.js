// ==UserScript==
// @name         IG Auto Participate GIveaway 
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      2024-08-31
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @license      MIT
// @downloadURL  https://github.com/gabrielemercolino/ParticipateIGGiveaway/open_giveaways.user.js
// @updateURL    https://github.com/gabrielemercolino/ParticipateIGGiveaway/open_giveaways.user.js
// @resource     giveaways https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.json
// ==/UserScript==
(function() {
    'use strict';

    var giveaways = JSON.parse(GM_getResourceText("giveaways"))

    function openInNewTab(url) {
        window.open(url, '_blank');
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function openAll(){
        for (const give of giveaways){
            openInNewTab("https://www.instant-gaming.com/giveaway/" + give);
            await sleep(2000);
        }
    }

    GM_registerMenuCommand("Open all giveaways", openAll);
})();
