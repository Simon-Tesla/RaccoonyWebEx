import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin} from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';

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
        // Or this:
        // https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/intermediary/f/0d9851f9-7e0b-4b32-aa93-5a999e8bdd04/dcqr0g8-c5443142-1dd0-4f0a-8810-6635620e5398.jpg/v1/fill/w_1024,h_1366,q_70,strp/rose_monster_hunter_oc_by_inkit89_dcqr0g8-fullview.jpg

        let img: HTMLImageElement = querySelector("img.dev-content-full") || querySelector("img.dev-content-normal");
        let previewUrl = img && img.src;


        // Get the download button
        let button = querySelector("a.dev-page-download");
        if (button) {
            // Get the download button URL
            // dA URLs look like so:
            // http://www.deviantart.com/download/[id]/[filename]_by_[username].[ext]?token=XX&ts=XX
            // or this:
            // https://www.deviantart.com/download/770524424/dcqr0g8-c5443142-1dd0-4f0a-8810-6635620e5398?token=14ab17518a8bd0b9254fd889bd572190afb4ec73&ts=1550460389
            url = button.getAttribute("href");

            //console.log("submission url", url);
            // Get the filename
            let urlObj = new URL(url);
            let path = urlObj.pathname.split("/");

            if (path[3].includes("_by_")) {
                // Parse the old-style dA download URL
                serviceFilename = filename = path.pop();
                //console.log("submission filename 1", filename);

                // De-munge the filename
                ext = filename.split(".").pop();
                let byIdx = filename.lastIndexOf("_by_");
                filename = filename.substring(0, byIdx);
                //console.log("submission filename 2", filename, byIdx);

                id = path.pop();
            }
        }

        if (!serviceFilename && previewUrl) {
            // The deviant disabled the download button or it's a newer style of download URL, so let's just grab the url from the image.
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

registerPlugin(DeviantArtPlugin, 'deviantart.com');