import * as I from '../definitions';
import * as logger from '../logger';
import { default as BaseSitePlugin, registerPlugin} from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';

const serviceName = "deviantart";

export class DeviantArtPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName, 'main');
    }

    async getMedia(): Promise<I.Media> {
        let res: I.Media = null;
        try {
            res = await this.getEclipseMedia();            
        }
        catch (e) {
            logger.log("getEclipseMedia failed, falling back to classic", e);
        }
        if (!res) {
            res = await this.getClassicMedia();
        }
        return res;
    }

    async getEclipseMedia(): Promise<I.Media> {
        // The download button contains nothing useful for us
        //const downloadButton = querySelector("[data-hook=download_button]");
        const img: HTMLImageElement = querySelector("[data-hook=art_stage] img");
        if (!img) {
            // There's no way to recover from a missing image element, so just return null.
            return null;
        }
        let url = img.src;
        const { serviceFilename, filename, ext } = extractMetadataFromDAFilename(url);
        
        // Get submission ID
        const canonicalLink: HTMLLinkElement = querySelector("link[rel=canonical]");
        const submissionId = getDASubmissionIdFromLink(canonicalLink.href);

        // Get username
        const userLink: HTMLAnchorElement = querySelector("[data-hook=deviation_meta] [data-hook=user_link]");
        const userName = userLink?.getAttribute("data-username");

        // Get title
        const title = getDASubmissionTitle();

        // Get description
        // There are multiple .legacy-journal elements on the page, but the description should be the first one.
        const descriptionElt = querySelector(".legacy-journal");
        const description = descriptionElt?.textContent;

        // Get tags
        // Unfortunately DA didn't provide a handy data-hook for tags, so we look for links containing "/tag/" in the URL.
        // DA tag URLs have the format: https://www.deviantart.com/tag/[tagname]
        const tagElts = querySelectorAll("a[href*='/tag/']");
        const tags = tagElts.map(t => t.textContent.trim());

        let media: I.Media = {
            url: url,
            submissionId: submissionId,
            siteName: serviceName,
            previewUrl: url,
            author: userName,
            filename: filename,
            extension: ext,
            siteFilename: serviceFilename,
            title: title,
            description: description,
            tags: tags
        };
        return media;
    }

    async getClassicMedia(): Promise<I.Media> {
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
        // Or this:
        // https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/519faa52-29f2-4b16-9af3-a2ac01070b26/dxu8ts-1f5d9a76-8ab1-48e6-a084-1f6101ae1840.jpg/v1/fill/w_600,h_771,q_75,strp/found_objects_by_timothyfrisby_dxu8ts-fullview.jpg
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
            // Note: the newer-style URL from the download button always fails for some reason.
            url = previewUrl;

            // De-munge the filename.
            // This gets us to "[filename]_by_[user]_[###]-fullview.[ext]" for the serviceFilename
            ({ serviceFilename, filename, ext } = extractMetadataFromDAFilename(previewUrl));
            if (!filename) {
                // This didn't work, so we probably have the second form of URL.
                // Make a filename from the image alt tag.
                filename = img.alt;
                const byIdx = filename.lastIndexOf(" by ");
                //console.log("submission filename 2", filename, byIdx);
                filename = filename.substring(0, byIdx);
            }

            // Grab the ID from the img element
            id = img.getAttribute("data-embed-id");
        }

        let title = getDASubmissionTitle();
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

        return media;
    }

    async getPageLinkList(): Promise<I.PageLinkList> {
        // Only allow galleries to be sorted by submission ID; everything else we leave unsorted.
        let nosort = window.location.pathname.indexOf("/gallery") === -1;

        // Try Eclipse-style links first
        let links: HTMLAnchorElement[] = querySelectorAll("[data-hook=deviation_link]");
        if (!links || links.length === 0) {
            // Then try classic links
            links = querySelectorAll(".messages a.thumb, .folderview a.thumb, .stream a.thumb, a.torpedo-thumb-link");
        }
        let list: I.PageLink[] = getPageLinksFromAnchors(links, getDASubmissionIdFromLink);

        let res: I.PageLinkList = {
            list: list,
            sortable: !nosort
        };

        return res;
    }

    hasPageLinkList(): Promise<boolean> {
        if (window.location.pathname.startsWith("/notifications")) {
            return Promise.resolve(true);
        }
        return super.hasPageLinkList();
    }
}

registerPlugin(DeviantArtPlugin, 'deviantart.com');

function getDASubmissionTitle() {
    var docTitle = document.title;
    let title = docTitle.substring(0, docTitle.lastIndexOf(" by "));
    return title;
}

function extractMetadataFromDAFilename(previewUrl: string) {
    const previewUrlObj = new URL(previewUrl);
    let filename = previewUrlObj.pathname.split("/").pop();
    const serviceFilename = filename
    const ext = filename.split(".").pop();
    // And then to "[filename]"
    const byIdx = filename.lastIndexOf("_by_");
    //console.log("submission filename 1", filename, byIdx);
    filename = filename.substring(0, byIdx);
    return { serviceFilename, filename, ext };
}

function getDASubmissionIdFromLink(href) {
    // dA submission URLs are usually of the format
    // http://www.deviantart.com/art/[title]-[id]
    let urlparts = href.split('-');
    return urlparts.pop();
}