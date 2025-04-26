// ==UserScript==
// @name         IG Auto Open and Participate Giveaway
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      2025-04-26
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
        constructor(link) {
            this.link = link;
        }

        async participate() {
            return new Promise((resolve, reject) => {
                let giveawayWindow = openInNewTab(this.link);
                if (!giveawayWindow) throw new CannotOpenWindow();

                // override window.open function to capture the boost windows
                const originalOpen = giveawayWindow.open;
                giveawayWindow.open = function(...args) {
                    const w = originalOpen.apply(this, args);

                    if (w) w.onload = w.close();

                    return w;
                };

                const timeout = setTimeout(() => {
                    giveawayWindow.close();
                    reject(new Error("Timeout loading giveaway page"));
                }, 10000);

                giveawayWindow.onload = async () => {
                    clearTimeout(timeout);
                    let hasBoosts = false;
                    const doc = giveawayWindow.document;

                    if (isGiveaway404(doc)) reject(new GiveawayInvalid());

                    // find and click boost buttons
                    for (let b of getBoostsButtons(doc)){
                        hasBoosts = true;
                        b.click();
                    }

                    // find and click participate button
                    const button = getValidationButton(doc);
                    if (!button) {
                        await sleep(500); // avoid spam
                        giveawayWindow.close();
                        reject(new GiveawayAlreadyParticipated());
                    }

                    button?.click();

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
            const giveaways = await loadGiveaways();
            console.log("giveaways: ", giveaways);
            let giveCount = 0;
            for (const [region, names] of Object.entries(giveaways)){
                // for now just skip invalids
                if (region === "invalids") continue;
                for (let name of names) {
                    giveCount += 1;
                    try {
                        await new Giveaway(`https://www.instant-gaming.com/${region}/giveaway/${name}`).participate();
                        console.log(`giveaway with ${name} (${region}) worked!`)
                        this.stats.participated += 1;
                    } catch(e) {
                        if (e instanceof GiveawayInvalid) {
                            console.log(`giveaway with ${name} (${region}) is invalid!`)
                            this.stats.invalid += 1;
                        } else if (e instanceof GiveawayAlreadyParticipated) {
                            console.log(`giveaway with ${name} (${region}) was already checked!`)
                        } else if (e instanceof CannotOpenWindow) {
                            alert("Couldn't open window, please disable pop-up block");
                            return;
                        }
                        else {
                            console.log(`something went swrong for giveaway with ${name} (${region})`)
                        }
                    }
                }
            }
            alert(`Total giveaway: ${giveCount}\nParticipated: ${this.stats.participated}\nInvalids: ${this.stats.invalid}`);
        }
    }

    GM.registerMenuCommand("Open giveaways", async () => {
        const manager = new GiveawayManager("https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.json");
        await manager.run();
    });

    /*
    GM.registerMenuCommand("Test", async () => {
        const region = "en";
        const name = "JOEPAD17";
        await new Giveaway(`https://www.instant-gaming.com/${region}/giveaway/${name}`).participate();
    });
    */
})();
