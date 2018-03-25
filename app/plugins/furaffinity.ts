import * as I from '../definitions';
import { default as BaseSitePlugin, querySelector, querySelectorAll, getFileTypeByExt, getPageLinksFromAnchors, getFilenameParts } from './base';

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

        // FA download URLs look like so:
        // http://d.facdn.net/art/[username]/[id]/[id].[username]_[origfilename].[ext]	
        // Preivew URLs look like so:
        // //t.facdn.net/22795737@400-[id].[ext]
        let urlParts = url.split("/");
        let serviceFilename = urlParts[urlParts.length - 1];
        let { filename, ext } = getFilenameParts(serviceFilename);
        let id = urlParts[urlParts.length - 2];
        let username = urlParts[urlParts.length - 3];

        // Strip off the ID from the filename, so that it doesn't get repeated when saved.
        filename = getOriginalFilename(filename, username);

        if (!ext) {
            // In rare cases, we don't even end up with an extension. 
            // We'll use the preview image extension and default to jpg if all else fails.
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
            type: getFileTypeByExt(ext),
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

function getMediaUrls() {
    // Get the download button, if it exists
    let button: HTMLAnchorElement = querySelector(".actions a[href^='//d.facdn.net/art/']") ||
        querySelector('.sidebar-section a.button.download-logged-in'); //Beta UI
    let url = button && button.href;

    let img = <HTMLImageElement>document.getElementById('submissionImg');
    let previewUrl = img && img.getAttribute('data-preview-src');

    if (!url && img) {
        // If all else fails, get the submission image source URL
        url = img.getAttribute('data-fullview-src') || img.src;
        if (url.indexOf('http:') !== 0 || url.indexOf('https:') !== 0) {
            // Add the protocol scheme to the URL if it's missing
            url = window.location.protocol + url;
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