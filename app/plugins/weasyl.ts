import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import { getFilenameParts } from '../utils/file';
import * as logger from '../logger';

const serviceName = "weasyl";

export class WeasylPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getMedia(): Promise<I.Media> {
        // Get the "canonical" link from the page header if available,
        // or bail out if not found.
        //
        // When Raccoony is trying to decide if it should run on a
        // particular page, it calls getMedia() first, and then
        // getPageLinkList().  So getMedia() will be called on pages
        // without a canonical link, such as the "recently popular"
        // page.  Detect that situation and bail out, so Raccoony can
        // go on and call getPageLinkList().
        let canonical = document.querySelector("link[rel=canonical]");
        if (!canonical) {
            return Promise.resolve(null);
        }

        // Get the native "download" button, or bail out if not found.
        //
        // Some pages have a "canonical" link, but no download button,
        // such as a user's main profile page.  Detect that situation
        // and bail out, so we don't try to parse things that may not
        // be there.
        let buttonSpan = document.querySelector("#detail-actions .icon-arrowDown");
        if (!buttonSpan) {
            return Promise.resolve(null);
        }
        let button = buttonSpan.parentElement;

        // If we get here, we probably have a canonical link and a download
        // button.

        // The canonical link has at least two formats; handle them both.
        // "visual", "literary", and "multimedia" submissions:
        // https://www.weasyl.com/%7E[user]/submissions/[id]/[title]
        // "character" submissions:
        // https://www.weasyl.com/character/[id]/[title]
        let canonicalLink = canonical.getAttribute("href");
        logger.log("weasyl: canonical href ", canonicalLink);

        // Split on slashes
        let canonicalObj = new URL(canonicalLink);
        let pathParts = canonicalObj.pathname.split('/');

        let username = "";
        let submissionId = "";
        let filename = ""

        if (canonicalLink.indexOf("/submissions/") > -1) {
            // regular submission
            logger.log("weasyl: regular submission");

            // Get the username and url-decode it so that %7e becomes '~' if it's present
            username = pathParts[1] || "";
            username = decodeURIComponent(username)

            // Record submission ID and filename
            submissionId = pathParts[3]
            filename = pathParts[4];
        }
        else if (canonicalLink.indexOf("/character/") > -1) {
            // character submission
            logger.log("weasyl: character submission");

            // Username isn't in canonical link, so get it from the title
            // above the artwork, which is of the format
            // <h1 id="detail-title" class="pad-left pad-right">CoolGuy <i>by</i>
            //   <a class="username" href="/~exampleartist">ExampleArtist</a></h1>
            let usernameLink = document.querySelector('#detail-title a.username');
            username = usernameLink.getAttribute("href");

            // Record locations of these pieces for later
            submissionId = pathParts[2];
            filename = pathParts[3];
        }
        else {
            // something weird - bail out
            return Promise.resolve(null);
        }

        // Strip off any leading tilde or path characters from the username
        username = username.replace(/^\/?~/, "");
        logger.log("weasyl: username ", username);

        submissionId = submissionId || "";
        logger.log("weasyl: submission id ", submissionId);

        // Use the title in the canonical link as part of the local filename
        // Canonical link is silent on the extension (jpg, png, mp3, etc),
        // so get that later
        filename = filename || "";
        logger.log("weasyl: filename ", filename);
        // FIXME  what if filename is blank here?

        // Get extension from the link in the native "download" button.
        // Don't use the preview URL for this, because it will always be an
        // image, even for non-image submssions.

        // Get the image URL from the download button, find the last '.' in it,
        // and take everything after that as the extension
        let url = button.getAttribute("href");
        let lastdot = url.lastIndexOf('.');
        let ext = url.slice(lastdot + 1);
        logger.log("weasyl: extension ", ext);
        // FIXME what if ext is blank here?

        // Use the filename from the "canonical" link, plus the extension from
        // the download button, as serviceFilename
        let serviceFilename = filename + '.' + ext;
        logger.log("weasyl: serviceFilename ", serviceFilename);

        // Get the link to the preview/thumbnail image
        // If there is no thumbnail, previewURL ends up set to the URL of
        // the main file (FIXME: why?)
        let previewImg: HTMLImageElement = querySelector('#detail-art img');
        let previewUrl = (previewImg && previewImg.src) || null;

        let titleElt = document.getElementById("detail-title")
        let title = titleElt && titleElt.textContent.trim();
        let descriptionElt = querySelectorAll("#detail-description .formatted-content").pop();
        let description = descriptionElt && descriptionElt.textContent.trim();
        let tags = querySelectorAll(".di-tags .tags a")
            .map(el => el.textContent.trim());

        let media: I.Media = {
            url: url,
            previewUrl: previewUrl,
            author: username,
            filename: filename,
            siteFilename: serviceFilename,
            extension: ext,
            submissionId: submissionId,
            siteName: serviceName,
            title: title,
            description: description,
            tags: tags
        };
        logger.log("weasyl: media ", media);
        return Promise.resolve(media);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        let nosort = window.location.pathname.indexOf("/favorites") === 0;
        let links: HTMLAnchorElement[] = querySelectorAll(".thumb a.thumb-bounds");
        let list = getPageLinksFromAnchors(links, href => {
            // Weasyl submission URLs are of the format
            // https://www.weasyl.com/submission/[ID]/[title]
            let urlparts = href.split('/');
            urlparts.pop();
            return urlparts.pop();
        });

        let pageList: I.PageLinkList = {
            list: list,
            sortable: !nosort
        };
        return Promise.resolve(pageList);
    }
}

registerPlugin(WeasylPlugin, 'weasyl.com');
