# Changelog

## 1.2.2 (2019-02-17)
- Fixed deviantArt plugin [(issue #27)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/27).
- Fixed path sanitization to only sanitize parts of a path that contain a non-empty string.
- Added an alternate (experimental) Open in Tabs mode that opens tabs one at a time. This should help keep Firefox responsive when using Open in Tabs on a page with a lot of media links. Known issue: no way to stop tabs from loading except by exiting the browser completely.

## 1.2.1 (2018-08-25)
- Added support for downloading via right-click context menu from any website. The right-click menu option can be disabled in the global settings. Plugins can be written to enhance the support and allow for better metadata when saving.
- Added tumblr context menu download metadata support [(issue #17)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/17).
- Added support for Hentai Foundry [(issue #15)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/15)
- Added button to open the global settings from the site settings panel in the overlay.
- Added initial architecture support for multiple download destinations; currently this is only used to provide a different default path for right-click downloads, but may be expanded in the future.
- Fix incorrect character escaping for constructing paths [(issue #21)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/21)

## 1.1.5 (2018-05-20)
- Fixed: leading dots allowed in filenames again [(issue #13)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/13)
- Fixed: some site plugins didn't provide a siteFilename under all circumstances [(issue #14)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/14)
- Changed: existing files will be overwritten when downloading submissions in all browsers as per the previous firefox behavior.

## 1.1.4 (2018-04-28)
- Added feature to automatically download a submission when viewing its page [(Issue #5)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/5)
- Added gearfetishx plugin, contributed by Eupeptic
- Fixed: paths with leading or trailing dots (.) are replaced with underscores to allow saving; some FA usernames have trailing dots that triggered a download error.
- Fixed: if Raccoony detects that a submission has already been downloaded, it won't try to download the submission again. Downloading an already downloaded submission can be forced by using the [Shift] + D hotkey combo, if hotkeys are enabled.
- Changed: instead of overwriting or prompting when a file already exists when downloading, the browser will automatically [uniquify the filename](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/FilenameConflictAction).

## 1.1.3
- Fixed: #7 Patreon plugin not finding posts
- Added Shorpy plugin, contributed by Eupeptic

## 1.1.2
- Fixed: issue prevented hotkey handler from initializing correctly. (issue #4)
- Fixed: unsetting settings wouldn't behave correctly.
- Fixed: sourceUrl missing from metadata file output.

## 1.1.1
- Fixed a bug that prevented the settings UI from operating correctly under certain circumstances.

## 1.1.0
- Added a new UI for managing settings, both on a per-site and a global basis.
- Added the ability to customize your download path.
- Added back the ability to adjust the delay for opening all in tabs.
- Added back the ability to change the order tabs are opened in.
- Added back the metadata save feature.
- Implemented settings import/export feature.
- Many updates to the general code architecture to improve maintainability.

## 1.0.1
- Simplified download progress UI
- Fixed lightbox to only be available for images
- Fixed e621 bug: Raccoony will now always download the highest resolution available for an image
- Added a scroll-to-top activation gesture for entering fullscreen (disabled by default)
- Made some architecture changes that will enable better settings UI/configurability in the future.
- Added auto-update support to the manifest for Firefox (so hopefully that'll work in the future)

## 1.0.0
- Initial release
