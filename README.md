# Raccoony! ![Raccoony logo][logo]

**Now with 100% more WebExtension goodness™**

A web extension for Firefox and Chrome that adds shiny new features (like automatic downloading) to art sites. 
Inspired by the [FurAffinity Extender](https://andrewneo.github.io/faextender/) and [Inkbunny Downloader](http://www.humbird0.com/#/addons/inkbunny_downloader) Firefox addons.

See the [official website][website] for announcements.

This README is a work in progress.

## Features
- Download submissions from art sites
- Open all submissions in a gallery/notifications in tabs (with a timed delay)
- Show pictures in a "full-screen" view that covers the entire page (and optionally enter this view automatically)
- Hotkey support for downloading, opening in tabs and fullscreen

See the TODO list below for more planned features.

## Download & Install

For **Firefox** - download the XPI for the latest release on the **[releases page](https://github.com/Simon-Tesla/RaccoonyWebEx/releases)**

For **Chrome** - install from the **[Chrome Web Store](https://chrome.google.com/webstore/detail/raccoony-webextension/ejcbnfgeiphhnkmpjggnkkhnbefihelh)** 
## Building
- Install [Node.js](https://nodejs.org) and [npm](https://www.npmjs.com/) (usually comes with Node.js)
- (Optional?) Run `npm install -g typescript gulp`
- Run `npm install`
- Run `gulp build`

Extension files and build output will be in `dist/`.

## Changelog

1.1.2
- Fixed: issue prevented hotkey handler from initializing correctly. (issue #4)
- Fixed: unsetting settings wouldn't behave correctly.
- Fixed: sourceUrl missing from metadata file output.

1.1.1
- Fixed a bug that prevented the settings UI from operating correctly under certain circumstances.

1.1.0
- Added a new UI for managing settings, both on a per-site and a global basis.
- Added the ability to customize your download path.
- Added back the ability to adjust the delay for opening all in tabs.
- Added back the ability to change the order tabs are opened in.
- Added back the metadata save feature.
- Implemented settings import/export feature.
- Many updates to the general code architecture to improve maintainability.

1.0.1
- Simplified download progress UI
- Fixed lightbox to only be available for images
- Fixed e621 bug: Raccoony will now always download the highest resolution available for an image
- Added a scroll-to-top activation gesture for entering fullscreen (disabled by default)
- Made some architecture changes that will enable better settings UI/configurability in the future.
- Added auto-update support to the manifest for Firefox (so hopefully that'll work in the future)

1.0.0
- Initial release

## Roadmap
While I don't plan on implementing every TODO for it, I want to get most of them done in anticipation of releasing this extension on the [AMO](https://addons.mozilla.org/)/[Chrome Web Store](https://chrome.google.com/webstore/category/extensions)

### Feature TODO list 
- Fix downloaded status badge on overlay 
- Add help/first run experience
- Add functional toolbar/address bar icon
- Fullscreen UI actions

### Architecture TODO
- Move SettingsUi as a child of Page?
- Maybe package for Edge? 

## Credits
- The Raccoony logo ![Raccoony logo][logo] is ©[ScruffKerfluff][logoauthor], and is only licenced to be distributed as-is with unmodified Raccoony source code or binary distributions. It **MAY NOT** be distributed or modified under any other circumstances or used for profit.
- Eupeptic for contributing the base for Eka's Portal support
- AndrewNeo for his excellent [FurAffinity Extender](https://andrewneo.github.io/faextender-chrome/) extension. Some code in Raccoony is based on his work, and I consulted his code for some of the WebExtension API handling and for setting up the gulp build framework.

[logo]: https://github.com/Simon-Tesla/RaccoonyWebEx/raw/master/src/icon-64.png
[logoauthor]: https://twitter.com/ScruffKerfluff
[website]: http://raccoony.thornvalley.com