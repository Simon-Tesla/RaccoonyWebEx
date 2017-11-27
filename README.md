# RaccoonyWebEx

A web extension for Firefox and Chrome that adds shiny new features (like automatic downloading) to art sites. 
Inspired by the [FurAffinity Extender](https://andrewneo.github.io/faextender/) and [Inkbunny Downloader](http://www.humbird0.com/#/addons/inkbunny_downloader) Firefox addons.

This README is a work in progress, however if you are familiar with npm and gulp, you can build the extension yourself. 
Build output will end up in the `dist/` folder.

## Todo list 

- Fix download progress indicator
- Fix downloaded status badge on overlay 
- Save metadata file
- Refactor pageOverlay to have less internal state
- Add option to configure download directory
- Add option to sort tabs
- Add configurable tab delay (including an initial delay to allow the browser to load the delay pages)
- Add help/first run experience