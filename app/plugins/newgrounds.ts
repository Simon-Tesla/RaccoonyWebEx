import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import { getFilenameParts } from '../utils/file';
import * as logger from '../logger';
import { MediaType } from '../enums';

const serviceName = "newgrounds";
const galleryPageLinkSelector = "a.item-portalitem-art-medium, a.inline-card-portalsubmission, a.item-audiosubmission";

export class NewgroundsPlugin extends BaseSitePlugin {
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
        // If there are multiple creators listed, concatenate all their
        // names together, with commas between.
        let creatorNameElts = querySelectorAll(".item-user .item-details-main");
        let creatorNames = [];
        for (let name of creatorNameElts) {
            creatorNames.push(name.textContent.trim());
        }
        let creators = creatorNames.join(',');
        logger.log("newgrounds: creators ", creators);
        return creators;
    }

    getCanonicalUrl() {
        const canonicalUrlElt = querySelector<HTMLLinkElement>('link[rel=canonical]');
        return canonicalUrlElt?.href || window.location.href;
    }

    async hasMedia(): Promise<boolean> {
        const canonicalUrl = new URL(this.getCanonicalUrl());
        const pathname = canonicalUrl.pathname;
        logger.log("newgrounds: hasMedia check");
        logger.log("newgrounds: hasMedia: url starts with /portal/view/ ? ",  (pathname.indexOf('/portal/view/')  === 0));
        logger.log("newgrounds: hasMedia: url starts with /audio/listen/ ? ", (pathname.indexOf('/audio/listen/') === 0));
        logger.log("newgrounds: hasMedia: getArtMedia has a url ? ",          this.getArtMedia()?.url);

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
        // old comment:
        // Only check file downloads for art; other media has to be treated specially.

        // new comment: check 'em all!

        let downloadable = this.getArtMedia();
        if(downloadable) {
            return downloadable;
        }

        downloadable = this.getVideoMedia();
        if(downloadable) {
            return downloadable;
        }

        downloadable = this.getAudioMedia();
        if(downloadable) {
            return downloadable;
        }

        return null;
    }

    getArtMedia(): I.Media {
        logger.log("newgrounds: art");

        // There can be slightly different markup for "small" and "large"
        // images.  Small images (the cutoff is roughly 500x600) do not
        // have click-to-embiggen, but larger ones do.  The file type
        // (JPG, PNG, GIF, WebP) doesn't seem to matter - only the pixel
        // size.  Check both possibilities.

        // large: ... div.pod_body div.image a#portal_item_view img
        // small: ... div.pod_body div.image img
        const largeImgElt: HTMLElement = querySelector("#portal_item_view img");
        const smallImgElt: HTMLElement = querySelector("div.image img");

        logger.log("newgrounds: large image, small image ", largeImgElt, smallImgElt);

        let urlWithBuster = null;

        if(largeImgElt) {
            urlWithBuster = largeImgElt.getAttribute('src');
        }
        else if(smallImgElt) {
            urlWithBuster = smallImgElt.getAttribute('src');
        }
        else {
            logger.log("newgrounds: couldn't find any image, bailing out");
            return null;
        }

        // Trim ?f123... cache-buster off of end of URL
        const fullUrl = urlWithBuster.split('?')[0];
        const previewUrl = fullUrl;
        logger.log("newgrounds: fullUrl previewUrl ", fullUrl, previewUrl);

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
        // There are a couple of possibilities here:
        // 1. "Modern" video; at least mp4 and maybe others.
        // 2. Flash videos (and games) - Newgrounds' original speciality.
        //
        // Both kinds start with a "click to play" screen, with a static
        // thumbnail and a "play" arrow.
        //
        // On a modern video, we can't find the link to the mp4 until the
        // user clicks-to-play. The embedded video player then gives us a
        // "source" element, which gives us the URL for the .mp4.
        //
        // On a Flash video, there is an iframe on both the "click to play"
        // and playing screens. The iframe loads the Ruffle flash emulator
        // and then the Flash file. The iframe src has the link to the .swf
        // in it, as one of the parameters to Ruffle.
        //
        // (As an alternative for at least Flash videos, there is a script
        // that does a "new embedController", similar to what happens for
        // audio files; that script also has the link to the .swf.  This is
        // not implemented here, but I (E) figured I'd note it.)

        const canonicalUrl = this.getCanonicalUrl();

        // This element will be present for both modern and Flash videos
        const videoElt: HTMLVideoElement = querySelector('video');
        logger.log("newgrounds: video element ", videoElt);

        // This element will only be present for Flash videos
        const flashVideoElt = querySelector('iframe');
        logger.log("newgrounds: flash video element ", flashVideoElt);

        if (!videoElt || canonicalUrl.indexOf('/portal/view') === -1) {
            logger.log("newgrounds: no video element, or 'portal/view' not in URL");
            return null;
        }

        let fullUrlWithBuster = '';

        // Handle modern videos
        if(!flashVideoElt) {
            if (getComputedStyle(videoElt, null).visibility === 'hidden') {
                // This code doesn't work until after the user has started
                // playing the video, as the video element doesn't contain a
                // valid video URL until after the user clicks play.
                // Need to check the visibility of the element first
                alert("Can't download Newgrounds video unless you've started playing it. Press play and then try again.");
                return null;
            }

            const sourceElt: HTMLSourceElement = videoElt.querySelector('source');
            fullUrlWithBuster = sourceElt.src;
        }

        // Handle Flash videos/games
        if(flashVideoElt) {
            // The iframe is available even on the static click-to-play screen,
            // so try to pull the URL to the .swf out of it.
            let ruffleLink = flashVideoElt.getAttribute('src');
            logger.log("newgrounds: ruffle link ", ruffleLink);

            // The parameters to Ruffle are %-encoded
            let decodedRuffleLink = decodeURI(ruffleLink);
            logger.log("newgrounds: decoded ruffle link ", decodedRuffleLink);
            let ruffleParameters = decodedRuffleLink.split('&');
            logger.log("newgrounds: ruffle parameters ", ruffleParameters);

            // The "props=" parameter is the one we want
            let ruffleProps = '';
            for (let parameter of ruffleParameters) {
                if (parameter.startsWith("props=")) {
                    ruffleProps = parameter;
                }
            }
            logger.log("newgrounds: props= parameter ", ruffleProps);

            // The props= parameter is also %-encoded
            let decodedRuffleProps = decodeURIComponent(ruffleProps);
            logger.log("newgrounds: decoded props ", decodedRuffleProps);

            // props= is followed by an array that's pretty much JSON,
            // but's let's parse it more simply than that...
            let propsPieces = decodedRuffleProps.split(',');
            logger.log("newgrounds: props pieces ", propsPieces);
            let swfProp = '';
            for (let property of propsPieces) {
                if (property.startsWith("\"swf\":\"http")) {
                    swfProp = property;
                }
            }
            logger.log("newgrounds: swfProp ", swfProp);

            // Get everything between the 'http' and the final '"'
            let urlStart = swfProp.indexOf("http");
            let urlEnd = swfProp.lastIndexOf("\"");
            logger.log("newgrounds: url start, end ", urlStart, urlEnd);
            fullUrlWithBuster = swfProp.slice(urlStart, urlEnd);
        }

        logger.log("newgrounds: video url with buster ", fullUrlWithBuster);

        // Remove the '?123456' cache-buster on the end of the URL, if any
        let lastQuestion = fullUrlWithBuster.lastIndexOf("?");
        let fullUrl = fullUrlWithBuster.slice(0, lastQuestion);
        logger.log("newgrounds: video fullUrl ", fullUrl);

        // At this point, we should have a good fullUrl for either modern
        // or Flash videos.

        // Newgrounds video file URLs don't appear to have much metadata in them
        // modern https://uploads.ungrounded.net/alternate/[IDPrefix]/[FileID]_alternate_[ID?].720p.mp4?[nonce]
        // Flash  https://uploads.ungrounded.net/[id-floor]/[id]_[name].swf
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
        // Audio parsing logic contributed by Eupeptic
        logger.log("newgrounds: audio");

        // When you first land on an audio page, Newgrounds appears to
        // go ahead and load the audio player; it doesn't defer loading
        // like it does for a movie.
        //
        // The direct link to the mp3 is apparently only available in
        // an embedded <script> tag.  We can probably also "guess" it
        // if we have the submission ID.

        // Try to get it from the embedded script first.  There is more
        // than one script, so look for the right one.
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
        const links: HTMLAnchorElement[] = querySelectorAll('.body-main a[href*="/art/view"], .body-main a[href*="/portal/view"], .body-main a[href*="/audio/listen"]');
        const list = getPageLinksFromAnchors(links, () => null);
        return list;
    }

    getFavoritesLinkList(): I.PageLink[] {
        const links: HTMLAnchorElement[] = querySelectorAll('a.item-portalitem-art-small, a.item-portalsubmission-small, a.item-link');
        const list = getPageLinksFromAnchors(links, () => null);
        return list;
    }

    getSubmissionGalleryLinkList(): I.PageLink[] {
        const links: HTMLAnchorElement[] = querySelectorAll(galleryPageLinkSelector);
        const list = getPageLinksFromAnchors(links, (_, link) => {
            const thumbSrc = link.querySelector('img')?.src;
            const thumbUrl = new URL(thumbSrc);
            const filename = thumbUrl.pathname.split('/').pop();
            const id = filename.split('_').shift();
            return id;
        });
        return list;
    }

    async getPageLinkList(): Promise<I.PageLinkList> {
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

registerPlugin(NewgroundsPlugin, 'newgrounds.com');
