// ==UserScript==
// @name         IG Auto Participate Giveaway 
// @namespace    https://github.com/gabrielemercolino/ParticipateIGGiveaway
// @version      2024-09-01
// @description  automatically participate Instant Gaming giveaway
// @author       gabrielemercolino
// @match        *://www.instant-gaming.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-idle
// @license      MIT
// @downloadURL  https://github.com/gabrielemercolino/ParticipateIGGiveaway/participate.js
// @updateURL    https://github.com/gabrielemercolino/ParticipateIGGiveaway/participate.js
// ==/UserScript==

(function() {
  'use strict';

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function participate(){
    const button = document.querySelector("button.button.validate");
    if (button == null) return;
    button.click();
  }

  participate();
})();
