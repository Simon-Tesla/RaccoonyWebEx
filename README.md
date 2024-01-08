# Raccoony! 
![Raccoony logo][logo]

A web extension for Firefox ~~and Chrome~~ that adds shiny new features (like automatic downloading) to art sites. 
Inspired by the [FurAffinity Extender](https://andrewneo.github.io/faextender/) and [Inkbunny Downloader](http://www.humbird0.com/#/addons/inkbunny_downloader) Firefox addons.

See the [discussion forum][forum] for announcements.

## Features
- Download submissions from art sites
- Open all submissions in a gallery/notifications in tabs (with a timed delay)
- Show pictures in a "full-screen" view that covers the entire page (and optionally enter this view automatically)
- Hotkey support for downloading, opening in tabs and fullscreen
- Supported sites: deviantArt, e621, Eka's Portal (contributed by Eupeptic), FurAffinity, Furry Network, InkBunny, Itaku, Patreon, Shorpy.com (contributed by Eupeptic), SoFurry, SubscribeStar and Weasyl.

## Download & Install

For **Firefox (desktop)** - download the XPI for the latest release on the **[releases page](https://github.com/Simon-Tesla/RaccoonyWebEx/releases)**

~~For **Chrome** - install from the~~ **[~~Chrome Web Store~~](https://chrome.google.com/webstore/detail/raccoony-webextension/ejcbnfgeiphhnkmpjggnkkhnbefihelh)** 

**Chrome support has been put on hold for now, see [this discussion post](https://github.com/Simon-Tesla/RaccoonyWebEx/discussions/169) for details.**

## Building
1. Install [Node.js](https://nodejs.org) and [npm](https://www.npmjs.com/) (usually comes with Node.js)
    - Currently I recommend using Node v16 or later.
    - I recommend using [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) to install Node.js, especially if you develop other projects dependent on Node.js.
2. Run `npm install`
3. Run `npm run build`

Extension files and build output will be in `dist/`.

## Changelog

See the [changelog](https://github.com/Simon-Tesla/RaccoonyWebEx/blob/master/CHANGELOG.md)

## Contributing

See the [CONTRIBUTING](https://github.com/Simon-Tesla/RaccoonyWebEx/blob/master/CONTRIBUTING.md) document. This is a free-time project for me, and I have no need for monetary donations, so I'm looking for coding help more than anything else. 

## Credits
- The Raccoony icon ![Raccoony logo][logo] is a slightly modified version of the raccoon emoji distributed in [Google Noto Emoji](https://github.com/googlefonts/noto-emoji), licenced under the [Apache 2.0 License](https://github.com/googlefonts/noto-emoji/blob/main/LICENSE).
- The old Raccoony icon ![ScruffKerfluff's Raccoony logo][oldlogo] is ©[ScruffKerfluff][logoauthor], and is only licenced to be distributed as-is with unmodified Raccoony source code or binary distributions. It **MAY NOT** be distributed or modified under any other circumstances or used for profit.
- Eupeptic for contributing the Eka's Portal and Shorpy plugins.
- AndrewNeo for his excellent [FurAffinity Extender](https://andrewneo.github.io/faextender-chrome/) extension. Some code in Raccoony is based on his work, and I consulted his code for some of the WebExtension API handling and for setting up the gulp build framework.
- UI Icons from [CSS.gg](https://css.gg/) and [Ionicons](https://ionic.io/ionicons), both licenced under the MIT license.

[logo]: ./src/raccoon.svg
[oldlogo]: ./src/scrufflogo.png
[logoauthor]: https://twitter.com/ScruffKerfluff
[website]: http://raccoony.thornvalley.com
[forum]: https://github.com/Simon-Tesla/RaccoonyWebEx/discussions
