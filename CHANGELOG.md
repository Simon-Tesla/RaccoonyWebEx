# Changelog

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