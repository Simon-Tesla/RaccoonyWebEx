import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors, getPageLinksFromSelector } from '../utils/dom';
import { getFilenameParts } from '../utils/file';
import * as logger from '../logger';
import { MediaType } from '../enums';

const serviceName = "itaku";
const galleryPageLinkSelector = "a.item-portalitem-art-medium, a.inline-card-portalsubmission, a.item-audiosubmission";

export class ItakuPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getTitle() {
        return querySelector('meta[property="og:title"]')?.getAttribute('content');
    }

    getSubmissionId() {
        // This only works when logged in
        return querySelector<HTMLInputElement>('input[name=generic_id')?.value;
    }

    getDescription() {
        return querySelector('#author_comments')?.textContent;
    }

    getTags() {
        return querySelectorAll('dd.tags a').map(el => el.textContent);
    }

    getCreator() {
        return querySelector(".item-user .item-details-main")?.textContent.trim();
    }

    getCanonicalUrl() {
        const canonicalUrlElt = querySelector<HTMLLinkElement>('link[rel=canonical]');
        return canonicalUrlElt?.href || window.location.href;
    }

    async hasMedia(): Promise<boolean> {
        const canonicalUrl = new URL(this.getCanonicalUrl());
        const pathname = canonicalUrl.pathname;
        return pathname.indexOf('/portal/view/') === 0 ||
            pathname.indexOf('/audio/listen/') === 0 ||
            !!this.getArtMedia()?.url;
    }

    async getMedia(): Promise<I.Media> {
        const canonicalUrl = new URL(this.getCanonicalUrl());
        const pathname = canonicalUrl.pathname;
        if (pathname.indexOf('/portal/view/') === 0) {
            return this.getVideoMedia();
        }
        else if (pathname.indexOf('/audio/listen/') === 0) {
            return this.getAudioMedia();
        }
        else {
            return this.getArtMedia();
        }
    }

    async checkFileDownload(): Promise<I.Media> {
        // Only check file downloads for art; other media has to be treated specially.
        return this.getArtMedia();
    }

    getArtMedia(): I.Media {
        // TODO: rewrite for itaku
        const pageImgAnchor: HTMLAnchorElement = querySelector("#portal_item_view");
        if (!pageImgAnchor) {
            return null;
        }
        const pageImg = pageImgAnchor.querySelector('img');
        const fullUrl = pageImgAnchor.href;
        const previewUrl = pageImg.src;

        // Newgrounds IDs are embedded in the image source URL, like so:
        // "https://art.ngfiles.com/images/[IDPrefix]/[SubmissionID]_[username]_[title].[ext]?[nonce or something]"
        const urlObj = new URL(fullUrl);
        // Filename is the last piece of the path
        const serviceFilename = urlObj.pathname.split('/').pop();
        const { ext, filename: fullFilename } = getFilenameParts(serviceFilename);
        const [submissionId, _, ...filenameParts] = fullFilename.split('_');
        const filename = filenameParts.join('_');

        const title = this.getTitle() || filename;
        const username = this.getCreator();
        const description = this.getDescription();
        const tags = this.getTags();

        const result: I.Media = {
            url: fullUrl,
            siteName: serviceName,
            submissionId: submissionId ?? this.getSubmissionId(),
            previewUrl: previewUrl,
            author: username,
            filename: filename,
            siteFilename: serviceFilename,
            extension: ext,
            title: title,
            description: description,
            tags: tags
        }

        return result;
    }

    getVideoMedia(): I.Media {
        // TODO: rewrite for itaku
        const canonicalUrl = this.getCanonicalUrl();
        const videoElt: HTMLVideoElement = querySelector('video');
        if (!videoElt || canonicalUrl.indexOf('/portal/view') === -1) {
            return null;
        }
        if (getComputedStyle(videoElt, null).visibility === 'hidden') {
            // This code doesn't work until after the user has started playing the video, as the video element doesn't 
            // contain a valid video URL until after the user clicks play.
            // Need to check the visibility of the element first
            alert("Can't download Newgrounds video unless you've started playing it. Press play and then try again.");
            return null;
        }

        const sourceElt: HTMLSourceElement = videoElt.querySelector('source');
        const fullUrl = sourceElt.src;
        // Newgrounds video file URLs don't appear to have much metadata in them
        // "https://uploads.ungrounded.net/alternate/[IDPrefix]/[FileID]_alternate_[ID?].720p.mp4?[nonce]"
        const urlObj = new URL(fullUrl);
        // Filename is the last piece of the path
        const serviceFilename = urlObj.pathname.split('/').pop();
        const { ext } = getFilenameParts(serviceFilename);

        // The submission URL has the ID in it. Use the canonical URL in case the user navigated using some other type of URL.
        const submissionId = canonicalUrl.split('/').pop() || this.getSubmissionId();
        const username = this.getCreator();
        const title = this.getTitle();
        const description = this.getDescription();
        const tags = this.getTags();

        return {
            url: fullUrl,
            siteName: serviceName,
            submissionId: submissionId,
            previewUrl: fullUrl,
            type: MediaType.Video,
            author: username,
            filename: title,
            siteFilename: serviceFilename,
            extension: ext,
            title: title,
            description: description,
            tags: tags
        }
    }

    getAudioMedia(): I.Media {
        // TODO: rewrite for itaku

        // Audio parsing logic contributed by Eupeptic
        logger.log("newgrounds: audio");

        // When you first land on an audio page, Newgrounds appears to
        // go ahead and load the audio player; it doesn't defer loading
        // like it does for a movie.
        //
        // The direct link to the mp3 is apparently only available in
        // an embedded <script> tag.  We can probably also "guess" it
        // if we have the submission ID.
        //

        // FIXME: Try to get it from the embedded script first.  There
        // is more than one script, so look for the right one.
        let scriptElts = querySelectorAll("div.pod.embed script");
        logger.log("newgrounds: script elements ", scriptElts);

        // The right script has a link to audio.ngfiles.com.
        let playerScript = "";
        var patt = new RegExp("https:\\\\\/\\\\\/audio.ngfiles.com\\\\\/");
        for (let script of scriptElts) {
            if (patt.test(script.innerHTML)) {
                playerScript = script.innerHTML;
            }
        }
        logger.log("newgrounds: script we like ", playerScript);

        // The right script starts out by new-ing an embedController
        // with a JSON-like list of variables.  The text looks like:
        //     var embed_controller = new embedController([{"url":"https:\/\/audio.ngfiles.com\/1132000\/1132047_Chromatic-Lagoon.mp3?f1652845649","is_published":true,
        // and then continues with more variables.
        // Hopefully, the "url" is always right before "is_published".
        let audioLinkStart = playerScript.indexOf('"url":"https:');
        let audioLinkEnd = playerScript.indexOf('","is_published');

        // skip over "url":" at beginning
        let audioLinkWithSlashes = playerScript.slice(audioLinkStart + 7, audioLinkEnd);
        logger.log("newgrounds: audio link so far ", audioLinkStart, audioLinkEnd, audioLinkWithSlashes);

        // turn all instances of "\/" in URL into just "/"
        let audioLink = audioLinkWithSlashes.replace(/\\\//g, "/")
        logger.log("newgrounds: audio link ", audioLink);

        // TODO: from here on, extracting the metadata is the same as
        // for an image, except for the username; maybe combine?

        // If we get here, we should have the direct link.  it looks like:
        // 0     1 2                 3          4
        // https://audio.ngfiles.com/[id-floor]/[submission_id]_[title].mp3?f1234567890
        // [id-floor] is the first even thousand below the submission ID.
        // For submission ID 123456, id-floor would be 123000 .
        // The ?123... varies; it might be a cache-buster.
        // Specific example, sfw:
        // https://audio.ngfiles.com/1132000/1132047_Chromatic-Lagoon.mp3?f1652845649

        // Trim ?f123... off of end of audio link and use as url
        let url = audioLink.split('?')[0];
        logger.log("newgrounds: url ", url);

        // Split link on slashes
        let audioParts = url.split('/');
        logger.log("newgrounds: audioParts ", audioParts);

        // Get submission ID from first part of filename in URL
        let idFilenameExt = audioParts[4];
        let firstUnder = idFilenameExt.indexOf('_');
        let submissionId = idFilenameExt.slice(0, firstUnder) || this.getSubmissionId();

        // Get filename+ext (alone) from last part of filename in URL
        let lastUnder = idFilenameExt.lastIndexOf('_');
        let filenameExt = idFilenameExt.slice(lastUnder + 1);

        // Split up filename and extension
        const { filename, ext } = getFilenameParts(filenameExt)

        // serviceFilename
        const serviceFilename = filenameExt;

        const username = this.getCreator();
        const title = this.getTitle();
        const tags = this.getTags();
        const description = this.getDescription();

        let media: I.Media = {
            url: url,
            previewUrl: url,
            author: username,
            filename: filename,
            siteFilename: serviceFilename,
            extension: ext,
            submissionId: submissionId,
            siteName: serviceName,
            title: title,
            description: description,
            tags: tags
        };
        return media
    }

    async hasPageLinkList(): Promise<boolean> {
        return !!querySelector(galleryPageLinkSelector) || 
            window.location.pathname.indexOf("/social") === 0 ||
            window.location.pathname.indexOf("/favorites") === 0;
    }

    getFeedLinkList(): I.PageLink[] {
        // TODO remove
        const links: HTMLAnchorElement[] = querySelectorAll('.body-main a[href*="/art/view"], .body-main a[href*="/portal/view"], .body-main a[href*="/audio/listen"]');
        const list = getPageLinksFromAnchors(links, () => null);
        return list;
    }

    getFollowedSubmissionsLinkList(): I.PageLink[] {
        // Link: https://itaku.ee/submission-inbox
        // Interface is an endless scroll that loads about 15 submissions at a time
        return getPageLinksFromSelector('a.seamless-link', extractSubmissionIdFromItakuUrl);
    }

    getPostLinkList(): I.PageLink[] {
        // Example link: https://itaku.ee/posts/95710
        return getPageLinksFromSelector('a.img-link', extractSubmissionIdFromItakuUrl);
    }

    getFavoritesLinkList(): I.PageLink[] {
        // Example link: https://itaku.ee/profile/simontesla/stars and probably https://itaku.ee/profile/simontesla/bookmarks
        return getPageLinksFromSelector('a.img-link', extractSubmissionIdFromItakuUrl);
    }

    getSubmissionGalleryLinkList(): I.PageLink[] {
        // Example link: https://itaku.ee/profile/simontesla/gallery
        return getPageLinksFromSelector('a.img-link', extractSubmissionIdFromItakuUrl);
    }

    getUserPostsLinkList(): I.PageLink[] {
        // TODO: https://itaku.ee/profile/simontesla/posts
        return []
    }

    // TODO: other lists
    // https://itaku.ee/home/posts
    // https://itaku.ee/home/images
    // https://itaku.ee/home
    // https://itaku.ee/home/commissions
    // https://itaku.ee/profile/fairythearthog/commissions/created
    // https://itaku.ee/home/users
    
    async getPageLinkList(): Promise<I.PageLinkList> {
        // TODO: implement itaku support

        // Newgrounds has an infinite scroll, so we cache the list of links that have been opened
        // and suppress those on subsequent calls. A refresh of the page clears the list.
        let sortable = false;
        let list: I.PageLink[] = [];
        const pathname = window.location.pathname;
        if (pathname.indexOf("/social") === 0) {
            list = this.getFeedLinkList();
        }
        else if (pathname.indexOf("/favorites") === 0) {
            list = this.getFavoritesLinkList();
        }
        else {
            list = this.getSubmissionGalleryLinkList();
            sortable = true;
        }
        
        const foundLinks = list.length > 0;

        // Filter out links that we've already opened
        list = list.filter(link => {
            const hasLink = this._visitedPages.has(link.url)
            if (!hasLink) {
                this._visitedPages.add(link.url);
            }
            return !hasLink;
        });

        if (foundLinks && list.length === 0) {
            // All of the links got filtered, display a message.
            alert("All of the links on this page have been opened. Scroll down to load additional images and try again.");
        }

        return {
            list: list,
            sortable: sortable
        };
    }

    private _visitedPages = new Set<string>();
}

registerPlugin(ItakuPlugin, 'itaku.ee');

function extractSubmissionIdFromItakuUrl(urlOrPath: string) {
    // Post links have the ID as the last path item, like so: https://itaku.ee/images/[ID]
    return urlOrPath.split('/').pop();
}