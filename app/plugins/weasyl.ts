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
        // Get the download button
        let buttonSpan = document.querySelector("#detail-actions .icon-arrowDown");
        if (!buttonSpan) {
            return Promise.resolve(null);
        }
        let button = buttonSpan.parentElement;

        // Get the image URL from the download button
        let url = button.getAttribute("href");

        let { username, filename, id } = this.getMetadataFromCanonicalUrl();

        // Grab the service filename from the download link.
        let { serviceFilename, filename: downloadButtonFilename, ext } = this.getMetadataFromDownloadButtonLink(url);
        // If filename is null, fall back to either the filename extracted from the download button or the service filename.
        filename = filename || downloadButtonFilename || serviceFilename;

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
            submissionId: id,
            siteName: serviceName,
            title: title,
            description: description,
            tags: tags
        };
        logger.log("weasyl: media ", media);
        return Promise.resolve(media);
    }

    private getMetadataFromCanonicalUrl() {
        // Get the "canonical" link from the page header, and take the href
        // The canonical link is of the format
        // https://www.weasyl.com/%7E[user]/submissions/[id]/[title]

        let canonical = document.querySelector("link[rel=canonical]");
        let canonicalLink = canonical.getAttribute("href");

        // Get the username and kill leading '%7E'
        let canonicalObj = new URL(canonicalLink);
        let pathParts = canonicalObj.pathname.split('/'); // "/~user/..."
        let username = pathParts[1] || "";
        username = decodeURIComponent(username).replace(/^~/, "");

        // Get the submission id
        let id = pathParts[3] || "";
        
        // Use the title in the canonical link as part of the local filename
        // Canonical link is silent on the extension (jpg, png, etc), so get that later
        let filename = pathParts[4] || "";
        
        return { username, filename, id };
    }

    private getMetadataFromDownloadButtonLink(url: string) {
        // Get the URL
        // Weasyl download URLs are of the format 
        // https://cdn.weasyl.com/~[user]/submissions/[id]/[hash]/[user]-[filename.ext]?download
        let urlObj = new URL(url);

        // Get the username
        let pathParts = urlObj.pathname.split('/'); // "/~user/..."
        let username = pathParts[1] || "";
        username = username.replace("~", "");

        // Get the filename
        let serviceFilename = pathParts.pop();
        pathParts.pop(); //pop off the unneeded hash
        let id = pathParts.pop();

        // Strip off the username
        let { filename, ext } = getFilenameParts(serviceFilename);
        filename = filename.substring(username.length + 1);

        return { serviceFilename, filename, username, ext }
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