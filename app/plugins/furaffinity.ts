import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import { getFilenameParts } from '../utils/file';
import * as logger from '../logger';

const serviceName = "furaffinity";

export class FuraffinityPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getMedia(): Promise<I.Media> {
        let { url, previewUrl } = getMediaUrls();

        if (!url) {
            // Didn't find a URL on the page, so let's give up.
            return Promise.resolve(null);
        }

        // FA download URLs vary a bit depending on the submission type:
        //
        // art   https://d.facdn.net/art/[username]/[id1]/[id2].[username]_[origfilename].[ext]
        // music https://d.facdn.net/art/[username]/music/[id1]/[id2].[username]_[origfilename].[ext]
        // story https://d.facdn.net/art/[username]/stories/[id1]/[id2].[username]_[origfilename].[ext]
        //
        // id1 and id2 can be slightly different numbers.  In limited
        // testing, I (Eupeptic) think id1 and id2 are equal if the artist
        // uploaded the submission and then never updated it.  If the
        // artist does update the sumbission, id2 stays the same, but id1
        // changes to a larger number.  I've seen id1 be as much as 475
        // and as little as 1 larger than id2.  I'm not sure if id1 can
        // be smaller than id2, but I think this is unlikely.  I have seen
        // them differ on files uploaded before the new FA UI on
        // 2019-12-31, so I don't think it's related to the UI change.

        // Preview URLs look like this:
        // //t.facdn.net/22795737@400-[id].[ext]
        // Yes, the protocol is missing.
        // They don't seem to vary by submission type.
        // The 400- can also be 200- or 800- , which probably sets the
        // thumbnail size.

        let urlParts = url.split("/");
        let serviceFilename = decodeURIComponent(urlParts[urlParts.length - 1]);
        let { filename, ext } = getFilenameParts(serviceFilename);

        // Use the submission's ID number instead of any id numbers in the download URL, 
        // as it won't change as new versions are uploaded.
        let id = getIdFromSubmissionUrl(window.location.href);

        // 0      1      2           3   4
        // https: (null) d.facdn.net art [username]
        let username = urlParts[4];
        logger.log("fa: urlParts and length ", urlParts, urlParts.length);
        logger.log("fa: username ", username);

        // Strip off the ID from the filename, so that it doesn't get repeated when saved.
        filename = getOriginalFilename(filename, username);

        if (!ext) {
            // In rare cases, we don't even end up with an extension.
            // We'll use the preview image extension and default to jpg if all else fails.
            // FIXME: This will fail on non-image submissions; previewUrl
            // will point to the thumbnail image, so we'll get jpg, png,
            // or gif as an extension, but we should have mp3, txt, pdf,
            // or similar.
            ext = getFilenameParts(previewUrl).ext || 'jpg';
        }

        let title = getTitle();
        let description = getDescription();
        let tags = getTags();

        if (!filename) {
            // Sometimes the image doesn't end up with a filename; in this case we'll read a title from the metadata
            filename = title
        }

        const result: I.Media = {
            url: url,
            siteName: serviceName,
            submissionId: id,
            previewUrl: previewUrl,
            author: username,
            filename: filename,
            siteFilename: serviceFilename,
            extension: ext,
            title: title,
            description: description,
            tags: tags
        }

        return Promise.resolve(result);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        let list: I.PageLink[] = [];
        // Don't try to sort the favorites lists.
        let pageUrl = window.location.href;
        let sortable = !(pageUrl.indexOf("/favorites/") !== -1 || pageUrl.indexOf("/search/") !== -1);

        let links: HTMLAnchorElement[] = querySelectorAll("figure figcaption a[href*='/view/']");

        list = getPageLinksFromAnchors(links, getIdFromSubmissionUrl);

        return Promise.resolve({
            list: list,
            sortable: sortable
        });
    }
}

registerPlugin(FuraffinityPlugin, 'furaffinity.net');

function getMediaUrls() {
    // Get the download button, if it exists
    let button: HTMLAnchorElement = querySelector(".actions a[href^='//d.facdn.net/art/']") ||
        querySelector('.submission-sidebar .buttons .download a'); // New UI (as of 2019-12-31)
    logger.log("fa: button ", button);

    let url = button && button.href;
    logger.log("fa: url ", url);

    let img = <HTMLImageElement>document.getElementById('submissionImg');
    logger.log("fa: img ", img);

    let previewUrl = img && img.getAttribute('data-preview-src');
    logger.log("fa: previewURL ", previewUrl);

    if (!url && img) {
        // If all else fails, get the submission image source URL
        url = img.getAttribute('data-fullview-src') || img.src;
        if (url.indexOf('http:') !== 0 || url.indexOf('https:') !== 0) {
            // Add the protocol scheme to the URL if it's missing
            url = window.location.protocol + url;
        logger.log("fa: constructed URL ", url);
        }
    }

    return {
        url,
        previewUrl
    };
}

function getIdFromSubmissionUrl(url: string) {
    // FA submission URLs are of the format
    // https://www.furaffinity.net/view/[ID]/
    let match = url.match(/\/(\d+)\/?$/);
    return match && match[1];
}

function getOriginalFilename(filename: string, username: string) {
    // Expecting an FA filename: [id].[username]_[origfilename]
    let usrIndex = filename.indexOf(username);
    let idIndex = filename.indexOf('.');
    if (usrIndex !== -1) {
        return filename.substring(usrIndex + username.length + 1);
    }
    else if (idIndex !== -1) {
        return filename.substring(idIndex + 1);
    }
    return filename;
}

function getTitle(): string {
    let titleElt = querySelector("meta[property='og:title']");
    return titleElt
        ? titleElt.getAttribute('content')
        : '';
}

function getDescription(): string {
    let description = '';
    let descriptionElts = querySelectorAll("#page-submission .maintable .alt1 .maintable .alt1");
    if (descriptionElts && descriptionElts.length >= 3) {
        description = descriptionElts[2].textContent;
    }
    else {
        // Might be the beta layout
        let elt = querySelector('.p20') || querySelector('.submission-description')
        description = elt ? elt.textContent : '';
    }
    return description.trim();
}

function getTags(): string[] {
    let tagElts = querySelectorAll("#keywords a");
    if (!tagElts || tagElts.length === 0) {
        tagElts = querySelectorAll(".submission-sidebar .tags-row .tags a");
    }

    return tagElts.map((el) => el.textContent.trim());
}
