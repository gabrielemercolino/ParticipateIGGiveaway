// ==UserScript==
// @name         IG Auto Open Giveaway pages
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      1.2
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_registerMenuCommand
// @grant        GM_getResourceText
// @grant        GM_openInTab
// @run-at       document-idle
// @license      MIT
// @downloadURL  https://github.com/gabrielemercolino/ParticipateIGGiveaway/open_giveaways.user.js
// @updateURL    https://github.com/gabrielemercolino/ParticipateIGGiveaway/open_giveaways.user.js
// @resource     giveaways https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.json
// ==/UserScript==
(function() {
    'use strict';

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function openAll(){
        var giveaways = JSON.parse(GM_getResourceText("giveaways"))

        for (const give of giveaways){
            var window = GM_openInTab("https://www.instant-gaming.com/giveaway/" + give);
            await sleep(2000);
            window.close();
        }
    }

    GM_registerMenuCommand("Open all giveaways", openAll);
})();
