import * as I from '../definitions';
import { default as BaseSitePlugin, querySelector, querySelectorAll, getFileTypeByExt, getPageLinksFromAnchors, getFilenameParts } from './base';

const serviceName = "sofurry";

export class SofurryPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getMedia(): Promise<I.Media> {
        // Get the download button
        let button = document.getElementById("sfDownload") || querySelector("#sfContentImage a");
        if (!button) {
            return Promise.resolve(null);
        }

        // Get the URL
        var url = button.getAttribute("href");
        var id = window.location.href.split("/").pop();

        // Get the filename
        var titleElt = document.getElementById("sfContentTitle");
        var filename = titleElt.textContent.trim();
        // And the extension - we use the preview image to determine this.
        var imgPreview: HTMLImageElement = querySelector("#sfContentImage img");
        var ext = imgPreview.getAttribute("src").split('.').pop();
        var previewUrl = imgPreview.src;

        // Get the username
        var usernameElt = document.querySelector("#sf-userinfo-outer .sf-username");
        var username = usernameElt.textContent;

        let title = filename;
        let descriptionElt = querySelector("#sfContentDescription");
        let description = descriptionElt && descriptionElt.textContent.trim();
        let tags = querySelectorAll("#submission_tags .sf-tag")
            .map(tagEl => tagEl.textContent.trim());

        let media: I.Media = {
            url: url,
            previewUrl: previewUrl,
            author: username,
            filename: filename,
            extension: ext,
            type: getFileTypeByExt(ext),
            submissionId: id,
            siteName: serviceName,
            title: title,
            description: description,
            tags: tags
        };

        return Promise.resolve(media);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        let nosort = window.location.search.indexOf("sort=") !== -1 ||
            window.location.search.indexOf("sortby=") !== -1 ||
            window.location.pathname.indexOf("/browse") === 0;
        let links: HTMLAnchorElement[] = querySelectorAll(".items a.sfArtworkSmallInner, .items .sf-story-big-headline a, .items .sf-story-headline a, .items .sfTextDark a, .items .sf-browse-shortlist-title a, a.watchlist_thumbnail_link");
        let list = getPageLinksFromAnchors(links, href => {
            // SoFurry submission URLs are of the format
            // https://www.sofurry.com/view/[id]
            let urlparts = href.split('/');
            return urlparts.pop();
        });

        let pageLinks: I.PageLinkList = {
            list: list,
            sortable: !nosort
        };

        return Promise.resolve(pageLinks);
    }
}
