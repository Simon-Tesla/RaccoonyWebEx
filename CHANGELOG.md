# Changelog

## 1.5.0 (2025-2-17)

-   [Itaku] Add support for reshared images gallery by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/200
-   [FurAffinity] Add hasContentWarning support and skip autofullscreen by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/201

## 1.4.3 (2024-11-27)

-   Fix link detection in e621 plugin (2024-11 DOM update) by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/197

## 1.4.2 (2024-09-26)

-   Fix Patreon JSON metadata parsing bug by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/195

## 1.4.1 (2024-08-29)

-   Fix Patreon plugin, MutationObserver logic by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/192

## 1.4.0 (2024-07-04)

-   Simon/itaku substar fixes by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/184
-   Fixed Itaku gallery folder links (#181)
-   Fixed SubscribeStar downloading (#182)
-   Fixed Patreon audio detection (#180)
-   Added video support to SoFurry plugin
-   Added better UI for displaying errors when downloading
-   Add download support for Patreon's image viewer by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/185

## 1.3.3 (2024-03-03)

-   Fixed dA plugin, minor syntax error in icons by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/175
-   Fix Itaku plugin, add video and blacklist support by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/176

## 1.3.2 (2024-01-08)

-   Fix overbroad mutation selector infinite loop bug by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/170
-   Added e926.net support

## 1.3.1 (2024-01-07)

-   Fixed a minor bug in the full-screen UI that prevented auto-fullscreen from working.

## 1.3.0 (2024-01-07)

-   Fix non-image submissions on old FA UI and Flash support on both FA UIs by @Eupeptic1 in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/113
-   Make filename space-to-underscore substitution global by @Eupeptic1 in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/120
-   Furrynetwork submission ID fix by @Eupeptic1 in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/121
-   Make e621 plugin respect blacklist. Closes #122. by @Eupeptic1 in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/133
-   Update Open all in tabs behavior by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/139
-   Added Newgrounds support (#125) by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/140
-   Use SVG icons for logo and UI elements by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/141
-   Fix Furaffinity zindex bug with fullscreen overlay (#150) by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/151
-   Fix patreon scraper by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/166
-   Add Itaku support by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/167
-   Add SubscribeStar support by @Simon-Tesla in https://github.com/Simon-Tesla/RaccoonyWebEx/pull/168

## 1.2.5 (2021-09-06)

-   Fixed DeviantArt "Open All in Tabs" duplication bug (#103)
-   Fixed HentaiFoundary bug where some submissions wouldn't be recognized by Raccoony (#93)
-   Fixed e621 bug with recognizing the artist/author (#104)
-   Fixed filename sanitization code to replace tilde characters in Chrome (#90)
-   Fixed issues with metadata scraping in FurAffinity (#83, #85, #90)
-   Updated some library dependencies

Special thanks to Eupeptic, who contributed the majority of the fixes for this release.

## 1.2.4 (2021-01-18)

-   Implemented queued Open all in tabs - now Raccoony waits to open a new set of tabs until after the previous set has completed opening. (#28)
-   Changed the default Open all in tabs to the new "one tab at a time" behavior. The old behavior can still be accessed via settings.
-   Fixed e621 plugin - author extraction now works (#73)

## 1.2.3 (2020-04-03)

-   Experimental open all in tabs now restricts delayed tab opening to the same window that opened them.
-   Added current time and date placeholders for the download filename format
-   Fixed auto-downloading (#35)
-   Updated packages for React, WebExtension polyfill, and others
-   Fixes to deviantArt plugin, including Eclipse support (#36, #39)
-   Fixes to FurAffinity plugin (#44, #45, #46)
-   Fixes to Weasyl plugin (#48, #49)
-   Fixes to e621 plugin (#51)
-   Fixes to Eka's plugin (#41)
-   Fixes to Shorpy plugin (#37)

Special thanks to Eupeptic, whose plugin fix contributions easily make up the bulk of this release.

## 1.2.2 (2019-02-17)

-   Fixed deviantArt plugin [(issue #27)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/27).
-   Fixed path sanitization to only sanitize parts of a path that contain a non-empty string.
-   Added an alternate (experimental) Open in Tabs mode that opens tabs one at a time. This should help keep Firefox responsive when using Open in Tabs on a page with a lot of media links. Known issue: no way to stop tabs from loading except by exiting the browser completely.

## 1.2.1 (2018-08-25)

-   Added support for downloading via right-click context menu from any website. The right-click menu option can be disabled in the global settings. Plugins can be written to enhance the support and allow for better metadata when saving.
-   Added tumblr context menu download metadata support [(issue #17)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/17).
-   Added support for Hentai Foundry [(issue #15)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/15)
-   Added button to open the global settings from the site settings panel in the overlay.
-   Added initial architecture support for multiple download destinations; currently this is only used to provide a different default path for right-click downloads, but may be expanded in the future.
-   Fix incorrect character escaping for constructing paths [(issue #21)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/21)

## 1.1.5 (2018-05-20)

-   Fixed: leading dots allowed in filenames again [(issue #13)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/13)
-   Fixed: some site plugins didn't provide a siteFilename under all circumstances [(issue #14)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/14)
-   Changed: existing files will be overwritten when downloading submissions in all browsers as per the previous firefox behavior.

## 1.1.4 (2018-04-28)

-   Added feature to automatically download a submission when viewing its page [(Issue #5)](https://github.com/Simon-Tesla/RaccoonyWebEx/issues/5)
-   Added gearfetishx plugin, contributed by Eupeptic
-   Fixed: paths with leading or trailing dots (.) are replaced with underscores to allow saving; some FA usernames have trailing dots that triggered a download error.
-   Fixed: if Raccoony detects that a submission has already been downloaded, it won't try to download the submission again. Downloading an already downloaded submission can be forced by using the [Shift] + D hotkey combo, if hotkeys are enabled.
-   Changed: instead of overwriting or prompting when a file already exists when downloading, the browser will automatically [uniquify the filename](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/FilenameConflictAction).

## 1.1.3

-   Fixed: #7 Patreon plugin not finding posts
-   Added Shorpy plugin, contributed by Eupeptic

## 1.1.2

-   Fixed: issue prevented hotkey handler from initializing correctly. (issue #4)
-   Fixed: unsetting settings wouldn't behave correctly.
-   Fixed: sourceUrl missing from metadata file output.

## 1.1.1

-   Fixed a bug that prevented the settings UI from operating correctly under certain circumstances.

## 1.1.0

-   Added a new UI for managing settings, both on a per-site and a global basis.
-   Added the ability to customize your download path.
-   Added back the ability to adjust the delay for opening all in tabs.
-   Added back the ability to change the order tabs are opened in.
-   Added back the metadata save feature.
-   Implemented settings import/export feature.
-   Many updates to the general code architecture to improve maintainability.

## 1.0.1

-   Simplified download progress UI
-   Fixed lightbox to only be available for images
-   Fixed e621 bug: Raccoony will now always download the highest resolution available for an image
-   Added a scroll-to-top activation gesture for entering fullscreen (disabled by default)
-   Made some architecture changes that will enable better settings UI/configurability in the future.
-   Added auto-update support to the manifest for Firefox (so hopefully that'll work in the future)

## 1.0.0

-   Initial release
