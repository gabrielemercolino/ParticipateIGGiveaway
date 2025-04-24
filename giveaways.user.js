// ==UserScript==
// @name         IG Auto Open and Participate Giveaway
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      2025-04-24
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

(function() {
    'use strict';

    // utils
    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    function openInNewTab(url){ return window.open(url, "_blank"); }

    function isGiveaway404(doc) { return doc.querySelector("span.e404") !== null; }
    function getValidationButton(doc) { return doc.querySelector("button.button.validate"); }
    function getBoostsButtons(doc) { return doc.querySelectorAll("a.button.reward.alerts"); }

    function loadGiveaways(){
        return new Promise( (resolve, reject) =>{
            GM.xmlHttpRequest({
                method: "GET",
                url: "https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.json",
                headers: {"Content-Type": "application/json"},
                onload: function(response) {
                    // tampermonkey has response but greasemonkey has responseText
                    resolve(JSON.parse(response.response ?? response.responseText));
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // classes
    class CannotOpenWindow extends Error {}
    class GiveawayInvalid extends Error {}
    class GiveawayAlreadyParticipated extends Error {}

    class Giveaway {
        constructor(name) {
            this.link = `https://www.instant-gaming.com/giveaway/${name}`;
        }

        async participate() {
            return new Promise((resolve, reject) => {
                let giveawayWindow = openInNewTab(this.link);
                if (!giveawayWindow) throw new CannotOpenWindow();

                let hasBoosts = false;
                // override window.open function to capture the boost windows
                const originalOpen = giveawayWindow.open;
                giveawayWindow.open = function(...args) {
                    const w = originalOpen.apply(this, args);

                    if (w) {
                        hasBoosts = true;
                        w.onload = w.close();
                    }
                    return w;
                };

                const timeout = setTimeout(() => {
                    giveawayWindow.close();
                    reject(new Error("Timeout loading giveaway page"));
                }, 10000);

                giveawayWindow.onload = async () => {
                    clearTimeout(timeout);
                    const doc = giveawayWindow.document;

                    if (isGiveaway404(doc)) reject(new GiveawayInvalid());

                    // find and click boost buttons
                    for (let b of getBoostsButtons(doc)){
                        b.click();
                    }

                    // find and click participate button
                    const button = getValidationButton(doc);
                    if (!button) {
                        await sleep(500); // avoid spam
                        reject(new GiveawayAlreadyParticipated());
                    }

                    // close opened windows
                    await sleep(500); // avoid spam
                    if (hasBoosts) await sleep(2000); // wait a little bit more to see if the boosts did activate

                    // now close the giveaway window
                    giveawayWindow.close();
                    resolve();
                }
            })
        }
    }

    class GiveawayManager {
        constructor(sourceUrl) {
            this.sourceUrl = sourceUrl;
            this.stats = {
                participated: 0,
                invalid: 0
            };
        }

        async run() {
            try {
                const giveaways = await loadGiveaways();
                for (let giveName of giveaways) {
                    try {
                        await new Giveaway(giveName).participate();
                        this.stats.participated += 1;
                    } catch(e) {
                        if (e instanceof GiveawayInvalid) {
                            this.stats.invalid += 1;
                        } else if (e instanceof GiveawayAlreadyParticipated) {}
                    }
                }
                alert(`Total giveaway: ${giveaways.length}\nParticipated: ${this.stats.participated}\nInvalids: ${this.stats.invalid}`);
            }
            catch(e) {
                if (e instanceof CannotOpenWindow) {
                    alert("Couldn't open window, please disable pop-up block");
                    return;
                }
            }
        }
    }

    GM.registerMenuCommand("Open giveaways", async () => {
        const manager = new GiveawayManager("https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.json");
        await manager.run();
    });
})();
