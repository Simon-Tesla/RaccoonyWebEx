import * as I from '../definitions';
import { default as BaseSitePlugin, querySelector, querySelectorAll, getPageLinksFromAnchors, registerPlugin } from './base';
import { getFilenameParts } from '../utils/file';

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

        // Get the URL
        // Weasyl download URLs are of the format 
        // https://cdn.weasyl.com/~[user]/submissions/[id]/[hash]/[user]-[filename.ext]?download
        let url = button.getAttribute("href");
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

        let previewImg: HTMLImageElement = querySelector('#detail-art img');
        let previewUrl = (previewImg && previewImg.src) || null;

        let titleElt = document.getElementById("detail-title")
        let title = titleElt && titleElt.textContent.trim();
        let descriptionElt = querySelectorAll("#detail-description .formatted-content").pop();
        let description = descriptionElt && descriptionElt.textContent.trim();
        let tags = querySelectorAll("#di-tags .tags a")
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