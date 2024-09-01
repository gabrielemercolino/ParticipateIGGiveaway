// ==UserScript==
// @name         IG Auto Open Giveaway pages
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      1.3
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.registerMenuCommand
// @grant        GM.xmlHttpRequest
// @grant        GM.openInTab
// @run-at       document-idle
// @downloadURL  https://github.com/gabrielemercolino/ParticipateIGGiveaway/open_giveaways.user.js
// @updateURL    https://github.com/gabrielemercolino/ParticipateIGGiveaway/open_giveaways.user.js
// ==/UserScript==

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function openInAnotherTab(url){
	return window.open(url, "_blank");
}

function giveaways(){
	
  let giveaways = []

  GM.xmlHttpRequest({
    method: "GET",
    url: "https://raw.githubusercontent.com/gabrielemercolino/ParticipateIGGiveaway/main/giveaways.json",
    headers: { "Content-Type": "application/json" },
    onload: function(response) {
      JSON.parse(
        response.response).map(x => {
          giveaways.push(x);
        }
      );
    },
    onerror: function (err) {
      alert("Error while getting giveaway list, please report");
    }
  });
  
  return giveaways;
}

async function openAll(){
  for (const give of giveaways()){
    let win = openInAnotherTab("https://www.instant-gaming.com/giveaway/" + give);
    await sleep(2000);
    win.close();
  }
}

GM.registerMenuCommand("Open all giveaways", openAll);
