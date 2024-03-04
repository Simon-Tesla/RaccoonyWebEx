import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors, getPageLinksFromSelector } from '../utils/dom';
import { getFilenameParts } from '../utils/file';
import * as logger from '../logger';

const serviceName = "itaku";

export class ItakuPlugin extends BaseSitePlugin {
    constructor() {
        // Itaku is a single-page app with endless scroll, so the mutation observer will be doing most of the work.
        super(serviceName, 'app-root');
    }

    async hasMedia(): Promise<boolean> {
        return window.location.pathname.startsWith('/images/');
    }

    async getMedia(): Promise<I.Media> {
        // Preview link format: https://itaku.ee/api/media_2/gallery_imgs/[filename]_[hash?]/xl.[ext]
        // Note that the preview link is derived from the download link.
        const img = querySelector<HTMLImageElement>('.main-img');
        const previewUrl = img?.src;

        // Download link format: https://itaku.ee/api/media_2/gallery_imgs/[filename]_[hash?].[ext]
        const downloadButton = querySelector<HTMLAnchorElement>('a.mat-primary[target="_blank"]');
        const url = downloadButton.href ?? previewUrl; // Fall-back to displayed image.

        if (!url) {
            return null;
        }

        // Filename parsing
        const parsedUrl = new URL(url);
        const siteFilename = parsedUrl.pathname.split('/').pop();
        const filenameParts = getFilenameParts(siteFilename);
        const hashIdx = filenameParts.filename.lastIndexOf('_');
        const filename = hashIdx == -1 ? filenameParts.filename : filenameParts.filename.substring(0, hashIdx); // Remove the hash
        const extension = filenameParts.ext;

        // Submission ID parsing
        // Submission URL format: https://itaku.ee/images/[ID]
        const submissionId = window.location.pathname.split('/').pop();

        // Metadata parsing
        const authorLink = querySelector('a[data-cy="app-image-detail-owner"]');
        const author = authorLink.textContent.trim();

        const titleElt = querySelector('.header-title');
        const title = titleElt.textContent.trim();

        const descriptionElt = querySelector('.info-wrapper p.mat-body');
        const description = descriptionElt.textContent.trim();

        const tagElts = querySelectorAll('a[data-cy="app-image-detail-tags"]');
        const tags = tagElts.map(t => t.textContent.trim());

        return {
            url,
            previewUrl,
            author,
            filename,
            siteFilename,
            extension,
            submissionId,
            siteName: serviceName,
            title,
            description,
            tags
        };
    }

    async hasPageLinkList(): Promise<boolean> {
        const pathname = window.location.pathname;
        return this.isFeedLinkList(pathname) ||
            this.isSubmissionGalleryLinkList(pathname) ||
            this.isUsersLinkList(pathname) ||
            this.isSortedSubmissionGalleryLinkList(pathname);
    }

    private getFeedLinkList(): I.PageLink[] {
        // Interface is an endless scroll that loads about 15 submissions at a time.
        // The .mat-card-subtitle selector prevents links to comments from showing up.
        return getPageLinksFromSelector('.mat-card-subtitle a[href^="/posts/"], .mat-card-subtitle a[href^="/images/"]', extractSubmissionIdFromItakuUrl);
    }

    private isFeedLinkList(pathname: string) {
        // Example Links: 
        // https://itaku.ee/home
        // https://itaku.ee/submission-inbox
        // https://itaku.ee/home/posts
        // https://itaku.ee/home/commissions
        // https://itaku.ee/profile/[username]/commissions/created
        // https://itaku.ee/profile/[username]/posts
        return pathname === "/submission-inbox" ||
            pathname === '/submission-inbox/reshared' ||
            pathname === '/home' ||
            pathname === '/home/posts' ||
            pathname === '/home/commissions' ||
            (pathname.startsWith('/profile') && (
                pathname.endsWith('/commissions/created') ||
                pathname.endsWith('/posts')
            ));
    }

    private getSubmissionGalleryLinkList(): I.PageLink[] {
        // This selector (attempts to) omit any items with a content warning or blacklisted tag from being opened.
        // Ideally Itaku implements the blacklists/warnings on individual image submissions like other sites do, in which case this code would be unnecessary.
        return getPageLinksFromSelector('a.img-link:not(:has([data-cy=app-gallery-images-blacklisted]))', extractSubmissionIdFromItakuUrl);
    }

    private isSubmissionGalleryLinkList(pathname: string) {
        // Example links: 
        // https://itaku.ee/profile/simontesla/gallery
        // https://itaku.ee/profile/simontesla/stars 
        // https://itaku.ee/profile/simontesla/bookmarks
        // https://itaku.ee/submission-inbox/images
        // https://itaku.ee/home/images
        return (pathname.startsWith('/profile') && (
            pathname.endsWith('/stars') ||
            pathname.endsWith('/bookmarks')
        ));
    }

    private isSortedSubmissionGalleryLinkList(pathname: string) {
        // Example links: 
        // https://itaku.ee/profile/simontesla/gallery
        // https://itaku.ee/submission-inbox/images
        // https://itaku.ee/home/images
        // https://itaku.ee/posts/[postId]
        return pathname === '/submission-inbox/images' ||
            pathname === '/home/images' ||
            pathname.startsWith('/posts') ||
            (pathname.startsWith('/profile') && (
                pathname.endsWith('/gallery')
            ));

    }

    private getUsersLinkList(): I.PageLink[] {
        return getPageLinksFromSelector('a.user-title');
    }

    private isUsersLinkList(pathname: string) {
        // Example: https://itaku.ee/home/users
        return pathname === '/home/users';
    }

    async getPageLinkList(): Promise<I.PageLinkList> {
        // TODO: implement itaku support

        // Itaku has an infinite scroll, so we cache the list of links that have been opened
        // and suppress those on subsequent calls. A refresh of the page clears the list.
        let sortable = false;
        let list: I.PageLink[] = [];
        const pathname = window.location.pathname;
        if (this.isFeedLinkList(pathname)) {
            list = this.getFeedLinkList();
        }
        else if (this.isSubmissionGalleryLinkList(pathname)) {
            list = this.getSubmissionGalleryLinkList();
        }
        else if (this.isUsersLinkList(pathname)) {
            list = this.getUsersLinkList();
        }
        else if (this.isSortedSubmissionGalleryLinkList(pathname)) {
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
            // TODO: add bubble UI for this state
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