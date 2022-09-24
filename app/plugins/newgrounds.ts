import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import { getFilenameParts } from '../utils/file';
import * as logger from '../logger';
import { MediaType } from '../enums';

const serviceName = "newgrounds";
const galleryPageLinkSelector = "a.item-portalitem-art-medium, a.inline-card-portalsubmission";

export class NewgroundsPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getTitle() {
        return querySelector('meta[property="og:title"]')?.getAttribute('content');
    }

    getSubmissionId() {
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

    async hasMedia(): Promise<boolean> {
        return !!(this.getArtMedia()?.url || querySelector('video source'));
    }

    async getMedia(): Promise<I.Media> {
        // TODO: would be nice to support audio files, but Newgrounds handles them differently enough to make it troublesome.
        return this.getArtMedia() ??
            this.getVideoMedia()
    }

    async checkFileDownload(): Promise<I.Media> {
        // Only check file downloads for art; videos have to be treated specially.
        return this.getArtMedia();
    }

    getArtMedia(): I.Media {
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
        // This code doesn't work until after the user has started playing the video, as the video element doesn't contain a valid video URL until after the user clicks play.
        // Need to check the visibility of the element first
        const videoElt: HTMLSourceElement = querySelector('video');
        if (getComputedStyle(videoElt, null).visibility === 'hidden') {
            // TODO: need to avoid doing this for the download check
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
        
        // The submission URL has the ID in it, but so does the generic_id form element
        const submissionId = this.getSubmissionId();
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

    async hasPageLinkList(): Promise<boolean> {
        return !!querySelector(galleryPageLinkSelector);
    }

    async getPageLinkList(): Promise<I.PageLinkList> {
        // TODO: Newgrounds has infinite scroll, so this only sort of works.
        // In theory we could force the page to scroll to the bottom multiple times until we get a number of entries matching
        // the number we expect from the currently selected tab.
        // Or we could have it so that each button press returns the next set of links.

        const sortable = false; //TODO: figure out which pages are sortable
        const links: HTMLAnchorElement[] = querySelectorAll(galleryPageLinkSelector);
        const list = getPageLinksFromAnchors(links, (_, link) => {
            const thumbSrc = link.querySelector('img')?.src;
            const thumbUrl = new URL(thumbSrc);
            const filename = thumbUrl.pathname.split('/').pop();
            const id = filename.split('_').shift();
            return id;
        });

        return {
            list: list,
            sortable: sortable
        };
    }
}

registerPlugin(NewgroundsPlugin, 'newgrounds.com');

