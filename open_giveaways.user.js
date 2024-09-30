// ==UserScript==
// @name         IG Auto Open Giveaway pages
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      1.5.0
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @run-at       document-idle
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/open_giveaways.user.js
// @updateURL    https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/open_giveaways.user.js
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

async function openAll(){
  let l = await giveaways();
  for (const give of l){
    let w = openInNewTab(`https://www.instant-gaming.com/giveaway/${give}`);
    if (w) {
      await new Promise(async (resolve, reject) => {
        w.onload = async () => {
          await sleep(2000);
          w.close();
          resolve();
        };
      });
    } else {
      alert("Could not open window. Disable pop-up block");
      return;
    }
  }
}

GM.registerMenuCommand("Open all giveaways", openAll);
