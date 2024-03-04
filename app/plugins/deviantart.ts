import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin} from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';

const serviceName = "deviantart";

export class DeviantArtPlugin extends BaseSitePlugin {
    constructor() {
        // dA doesn't have a consistent root selector (aside from the over-broad 'body'), these cover the cases I've found.
        super(serviceName, 'main, #root, header + div');
    }

    async getMedia(): Promise<I.Media> {
        // As of early 2024, dA has started using class munging which makes support much more difficult.
        // We'll do best effort support for downloads, but it's likely that support will end up going away if this becomes too brittle
        const img: HTMLImageElement = querySelector('img[fetchpriority=high]') // 'img[sizes]' also appears to be a decent selector
        if (!img) {
            // There's no way to recover from a missing image element, so just return null.
            return null;
        }
        let url = img.src;
        // dA image URLs look like this: https://images-wixmp-####.wixmp.com/f/[GUID1]/####-[GUID2].png/v1/fill/w_1280,h_915,q_80,strp/filename_by_username_####-fullview.jpg?token=[JWT]
        const { serviceFilename, filename, ext } = extractMetadataFromDAFilename(url);

        // Get submission ID
        const canonicalLink: HTMLLinkElement = querySelector("link[rel=canonical]");
        const submissionId = getDASubmissionIdFromLink(canonicalLink.href);
        
        // Get title and username
        const { title, userName } = getDASubmissionTitleAndUser();

        // Get description
        // Amazingly, this one got easier to find. :P
        const descriptionElt = querySelector("#description .legacy-journal");
        const description = descriptionElt?.textContent;

        // Get tags
        // Unfortunately DA didn't provide a handy class for tags, so we look for links containing "/tag/" in the URL.
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

    async getPageLinkList(): Promise<I.PageLinkList> {
        // Only allow galleries to be sorted by submission ID; everything else we leave unsorted.
        let nosort = window.location.pathname.indexOf("/gallery") === -1;

        // The most reliable way to identify submission links is if they have '/art/' in the URL. 
        // The 'aria-label' check eliminates unnecessary duplicates.
        let links: HTMLAnchorElement[] = querySelectorAll("a[href*='/art/'][aria-label]");        
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

function getDASubmissionTitleAndUser() {
    const docTitle = document.title;
    const byIdx = docTitle.lastIndexOf(" by ");
    const title = docTitle.substring(0, byIdx);
    const userName = docTitle.substring(byIdx + 4, docTitle.lastIndexOf(' on DeviantArt'))
    return {
        title, 
        userName
    };
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