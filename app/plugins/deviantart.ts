import * as I from '../definitions';
import { default as BaseSitePlugin, querySelector, querySelectorAll, getFileTypeByExt, getPageLinksFromAnchors, getFilenameParts } from './base';

const serviceName = "deviantart";
const mutationSelector = 'body';

export class DeviantArtPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName, mutationSelector);
    }

    getMedia(): Promise<I.Media> {

        let url = '';
        let filename = '';
        let serviceFilename = '';
        let id = '';
        let ext = '';

        // Get the username
        let usernameElt = querySelector(".dev-title-container .username");
        let username = usernameElt && usernameElt.textContent;

        // Get the displayed image.
        // dA image URLs look like so:
        // http://img12.deviantart.net/64ca/i/2015/273/f/9/[filename]_by_[user]-d9bi7fp.jpg
        // Or it can also look like this:
        // http://orig15.deviantart.net/412a/f/2015/277/4/1/41dc9b8a50185effd6956ef62b506458-d9bxb8s.png

        let img: HTMLImageElement = querySelector("img.dev-content-full") || querySelector("img.dev-content-normal");
        let previewUrl = img && img.src;


        // Get the download button
        let button = querySelector("a.dev-page-download");
        if (button) {
            // Get the download button URL
            // dA URLs look like so:
            // http://www.deviantart.com/download/[id]/[filename]_by_[username].[ext]?token=XX&ts=XX
            url = button.getAttribute("href");
            //console.log("submission url", url);
            // Get the filename
            let urlObj = new URL(url);
            let path = urlObj.pathname.split("/");
            serviceFilename = filename = path.pop();
            //console.log("submission filename 1", filename);

            // De-munge the filename
            ext = filename.split(".").pop();
            let byIdx = filename.lastIndexOf("_by_");
            filename = filename.substring(0, byIdx);
            //console.log("submission filename 2", filename, byIdx);

            id = path.pop();

        } else if (previewUrl) {
            // The deviant disabled the download button, so let's just grab the url from the image.
            url = previewUrl;

            // De-munge the filename.
            serviceFilename = filename = url.split("/").pop();
            ext = filename.split(".").pop();
            let byIdx = filename.lastIndexOf("_by_");
            //console.log("submission filename 1", filename, byIdx);
            filename = filename.substring(0, byIdx);


            if (!filename) {
                // This didn't work, so we probably have the second form of URL.
                // Make a filename from the image alt tag.
                filename = img.alt;
                byIdx = filename.lastIndexOf(" by ");
                //console.log("submission filename 2", filename, byIdx);
                filename = filename.substring(0, byIdx);
            }

            // Grab the ID from the img element
            id = img.getAttribute("data-embed-id");
        }

        var docTitle = document.title;
        let title = docTitle.substring(0, docTitle.lastIndexOf(" by "));
        let descElt = querySelector(".dev-description");
        let description = (descElt && descElt.textContent) || '';
        let tags: string[] = []; //dA doesn't have tags.

        let media: I.Media = {
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
        };

        return Promise.resolve(media);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        let nosort = window.location.pathname.indexOf("/favourites") === 0 ||
            window.location.pathname.indexOf("/browse") === 0 ||
            window.location.search.indexOf("q=") !== -1 ||
            window.location.search.indexOf("order=") !== -1;

        let links: HTMLAnchorElement[] = querySelectorAll(".messages a.thumb, .folderview a.thumb, .stream a.thumb, a.torpedo-thumb-link");
        let list: I.PageLink[] = getPageLinksFromAnchors(links, href => {
            // dA submission URLs are usually of the format
            // http://www.deviantart.com/art/[title]-[id]
            let urlparts = href.split('-');
            return urlparts.pop();
        });

        let res: I.PageLinkList = {
            list: list,
            sortable: !nosort
        };

        return Promise.resolve(res);
    }

    hasPageLinkList(): Promise<boolean> {
        if (window.location.pathname.startsWith("/notifications")) {
            return Promise.resolve(true);
        }
        return super.hasPageLinkList();
    }
}
