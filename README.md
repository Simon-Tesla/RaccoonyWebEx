# RaccoonyWebEx ![Raccoony logo][logo]

See the [official website][website] for announcements.

A web extension for Firefox and Chrome that adds shiny new features (like automatic downloading) to art sites. 
Inspired by the [FurAffinity Extender](https://andrewneo.github.io/faextender/) and [Inkbunny Downloader](http://www.humbird0.com/#/addons/inkbunny_downloader) Firefox addons.

This README is a work in progress, however if you are familiar with npm and gulp, you can build the extension yourself. 
Build output will end up in the `dist/` folder.

## Changelog

1.0.1
- Simplified download progress UI
- Fixed lightbox to only be available for images
- Fixed e621 bug: Raccoony will now always download the highest resolution available for an image
- Added a scroll-to-top activation gesture for entering fullscreen (disabled by default)
- Made some architecture changes that will enable better settings UI/configurability in the future.

1.0.0
- Initial release

## Feature Todo list 

- Fix downloaded status badge on overlay 
- Save metadata file
- Add option to configure download directory
- Add option to sort tabs
- Add configurable tab delay (including an initial delay to allow the browser to load the delay pages)
- Add help/first run experience
- Add functional toolbar/address bar icon

## Architecture TODO
- Introduce a wrapper class (SiteActions) for the SitePlugins and move logic out of the BaseSitePlugin into SiteActions (in other words, let's favor composition over inheritance)
- Move all shared state out of PageOverlay and into Page
- Move SettingsUi as a child of Page

[logo]: https://github.com/Simon-Tesla/RaccoonyWebEx/raw/master/src/icon-64.png
[logoauthor]: https://twitter.com/ScruffKerfluff
[website]: http://raccoony.thornvalley.com