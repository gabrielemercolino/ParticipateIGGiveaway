# ParticipateIGGiveaway

Script for automatically participate on Instant Gaming giveaways

> [!warning]
> This is only a personal project, I am not affiliated with Instant Gaming in any way.
> Use it at your own risk, I am not responsible for any damage you may cause to your account or any other issue you may encounter.

## Features

- Automatically open all the giveaway pages
- Automatically click the participate button

> [!note]
> The giveaways are taken from a closed source api for security reasons, if you want to know more about it you can check the [api.ts](src/giveaway/api.ts) file.
> Statuses are also avaible [here](https://ig-giveaway-server.onrender.com)

## Installation

First you need to install either [Greasemonkey](http://www.greasespot.net/) or [Tampermonkey](https://tampermonkey.net/) depending on your browser.

> [!note]
> While it should work with both, it's primarily tested with Tampermonkey.
> Also, if you are on Windows you might have issues with the extensions not showing the button in the toolbar, in that case I dind't find a solution but it should be an issue with the browser/extension or even Windows settings and not with the script.

Then you can go to the [latest release](https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases/latest) and click on the file named `giveaways.user.js` and the extension should pick it up

## Usage

Go to [instant gaming](https://www.instant-gaming.com), log-in if necessary and just click the newly created button `"Open giveaways"` in the extension menù and watch it do the work.

> [!note]
> It **_should_** work even if your connection is slow
>
> If you encounter issues and you need to stop the auto-opening you can close the browser.

## Updating

If you installed the script after `3.0.0` the extension should be able to update the script by itself.

In any case you can go to the [latest release](https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases/latest) (or any of the [releases](https://github.com/gabrielemercolino/ParticipateIGGiveaway/releases)) and follow the installation process, the extension should ask if you want to upgrade it.

## Contribute

If you want to contribute you can fork the repo, do whatever you want to do and open a pr against the `dev` branch.

## Credits

All of this is based on enzomtpYT [InstantGaming-Giveaway-AutoParticipate](https://github.com/enzomtpYT/InstantGaming-Giveaway-AutoParticipate) and [InstantGamingGiveawayList](https://github.com/enzomtpYT/InstantGamingGiveawayList) repos
