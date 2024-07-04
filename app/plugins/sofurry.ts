import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';

const serviceName = "sofurry";

export class SofurryPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getMedia(): Promise<I.Media> {
        // TODO: support downloading stories
        // Get the download button
        const button = document.getElementById("sfDownload") || querySelector("#sfContentImage a");
        if (!button) {
            return Promise.resolve(null);
        }

        // Get the URL
        const url = button.getAttribute("href");
        const id = window.location.href.split("/").pop();

        // Get the filename
        const titleElt = document.getElementById("sfContentTitle");
        const filename = titleElt.textContent.trim();
        // And the extension - we use the preview image or video to determine this.
        const imgPreview = querySelector<HTMLImageElement | HTMLVideoElement>("#sfContentImage img, #sfContentImage video");
        const previewUrl = imgPreview.currentSrc; // currentSrc works on both IMG and VIDEO tags
        const previewUrlObj = new URL(previewUrl);
        let siteFilename = previewUrlObj.searchParams.get('filename');
        let ext = '';
        if (siteFilename) {
            // Found a filename on the preview image URL
            ext = siteFilename.split('.').pop();
        }
        else {
            // Probably dealing with a video, need to synthesize a filename and extension
            ext = previewUrlObj.searchParams.get('ext');
            ext = ext.replace('.', '');
            siteFilename = `${id}.${ext}`;
        }

        // Get the username
        const usernameElt = document.querySelector("#sf-userinfo-outer .sf-username");
        const username = usernameElt.textContent;

        const title = filename;
        const descriptionElt = querySelector("#sfContentDescription");
        const description = descriptionElt && descriptionElt.textContent.trim();
        const tags = querySelectorAll("#submission_tags .sf-tag")
            .map(tagEl => tagEl.textContent.trim());

        const media: I.Media = {
            url: url,
            previewUrl: previewUrl,
            author: username,
            filename: filename,
            siteFilename: siteFilename,
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

registerPlugin(SofurryPlugin, 'sofurry.com');