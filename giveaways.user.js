// ==UserScript==
// @name         IG Auto Open and Participate Giveaway
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      2.1.0
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @run-at       document-idle
// @noframes
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.user.js
// @updateURL    https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.user.js
// ==/UserScript==

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function giveaways(){
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

function openInNewTab(url){
    return window.open(url, "_blank");
}

async function participate(window) {
    return new Promise((resolve) => {
        const fallbackTimeout = setFallbackTimeout(resolve);

        window.onload = async () => {
            clearTimeout(fallbackTimeout);

            const document = window.document;

            if (isPageNotFound(document)) {
                await sleep(500); // avoid spam
                resolve({ invalid: 1, participated: 0 });
                return;
            }

            const button = getValidationButton(document);
            if (!button) {
                await sleep(500); // avoid spam
                resolve({ invalid: 0, participated: 0 });
                return;
            }

            button.click();

            for (let b of getBoostsButtons(document)){
                b.click();
            }

            await sleep(2000);
            resolve({ invalid: 0, participated: 1 });
        };
    });
}

function setFallbackTimeout(resolve) {
    return setTimeout(() => {
        resolve({ invalid: 1, participated: 0 });
    }, 10_000);
}

function isPageNotFound(document) {
    return document.querySelector("span.e404") !== null;
}

function getValidationButton(document) {
    return document.querySelector("button.button.validate");
}

function getBoostsButtons(document) {
    return document.querySelectorAll("a.button.reward.alerts")
}

async function openAll() {
    let stats = { invalid: 0, participated: 0 };
    let invalidLinks = [];

    // Step 1: Acquisizione dei link dei giveaway
    let gives;
    try {
        gives = await giveaways();
    } catch (error) {
        console.error("Error while getting giveaways:", error);
        alert("Error while getting giveaways.");
        return;
    }

    // Step 2: Iterazione sequenziale sui link e partecipazione
    for (const giveawayUrl of gives) {
        const windowHandle = openInNewTab(`https://www.instant-gaming.com/giveaway/${giveawayUrl}`);

        if (!windowHandle) {
            alert("Could not open window. Disable pop-up block.");
            return;
        }

        try {
            const result = await participate(windowHandle);
            console.log("Result: ", result);
            stats.participated += result.participated;
            stats.invalid += result.invalid;

            if (result.invalid > 0) invalidLinks.push(giveawayUrl);
        } catch (error) {
            console.error(`Error while trying with ${giveawayUrl}:`, error);
            invalidLinks.push(giveawayUrl);
        } finally {
            windowHandle.close();
        }
    }

    // Mostra i risultati finali
    console.log("Invalid links:", invalidLinks);
    alert(`Total giveaway: ${gives.length}\nParticipated: ${stats.participated}\nInvalids: ${stats.invalid}`);
}

GM.registerMenuCommand("Open giveaways", openAll);
