import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import * as logger from '../logger';
import { getFilenameParts } from '../utils/file';
import { MediaType } from '../enums';
import { Media } from '../definitions';
import { isElementVisible, querySelectorAll, querySelector } from '../utils/dom';

const siteName = "tumblr";

interface TumblrPostData {
    type: 'photo' | 'photoset',
    'post-id': number;
    // Only exists on photosets
    photoset_photos?: {
        width: number,
        height: number,
        low_res: string,
        high_res: string
    }[],
    'share_popover_data': {
        post_url: string,
    },
    'tumblelog-data': TumbleLogData,
    'tumblelog-root-data': TumbleLogData
}

interface TumbleLogData {
    dashboard_url: string,
    name: string,
}

export class TumblrPlugin extends BaseSitePlugin {
    constructor() {
        super(siteName);
    }

    async getMediaForSrcUrl(mediaUrl: string, mediaType: MediaType): Promise<Media> {
        if (window.location.hostname === 'www.tumblr.com' &&
            (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/blog')))
        {
            // Metadata scraper for posts on the dashboard

            if (mediaType === MediaType.Image) {
                // Tumblr image URLs typically look like this:
                // https://78.media.tumblr.com/[UUID]/tumblr_[IMGUUID]_[WIDTH].jpg

                const imgElts = querySelectorAll(`img[src='${mediaUrl}']`);
                let imgElt = imgElts.find(isElementVisible) || imgElts[0];
                if (imgElt) {
                    // Found the image element, let's get metadata about the post
                    // TODO: handle downloads from images in the lightbox (the larger-size popup when clicking the image)
                    const postElt = imgElt.closest('.post') as HTMLElement;

                    let highResImgUrl = '';
                    let author = '';
                    let sourceUrl = '';
                    let submissionId = '';
                    if (postElt.dataset['json']) {
                        // Tumblr is super cool and puts metadata in a convenient JSON blob on the DOM for most posts on the dashboard
                        const postData = JSON.parse(postElt.dataset['json']) as TumblrPostData;

                        if (postData.type === 'photoset') {
                            // Photoset metadata is in the JSON data
                            const imgData = postData.photoset_photos.find(p => p.low_res === mediaUrl);
                            highResImgUrl = imgData && imgData.high_res;
                        }

                        let tumblelogData = postData["tumblelog-root-data"] || postData["tumblelog-data"];

                        author = tumblelogData.name;
                        sourceUrl = postData.share_popover_data.post_url;
                        submissionId = `${postData['post-id']}`;
                    }
                    else {
                        // Posts without JSON are most likely in a sidebar
                        submissionId = postElt.dataset['postId'];
                        const permalinkElt = querySelector('.post_permalink') as HTMLAnchorElement;
                        sourceUrl = permalinkElt.href;
                        const origPostLink = querySelector('.original-reblog-content .reblog-header .reblog-tumblelog-name', postElt);
                        if (origPostLink) {
                            const postData = JSON.parse(origPostLink.dataset['peepr']) as {
                                tumblelog: string,
                                postId: string
                            };
                            author = postData ? postData.tumblelog : origPostLink.textContent.trim();
                        }
                    }

                    if (!highResImgUrl) {
                        // See if we can't get the high-res URL off of the link instead
                        let linkElt = imgElt.closest('a') as HTMLAnchorElement;
                        highResImgUrl = linkElt.dataset['bigPhoto'] || linkElt.href;
                    }

                    const siteFilename = new URL(highResImgUrl || mediaUrl).pathname.split('/').pop();
                    const { filename, ext } = getFilenameParts(siteFilename);

                    // Get description
                    const descElt = querySelector('.original-reblog-content .reblog-content', postElt);
                    const description = descElt ? descElt.textContent : '';

                    // Get post tags
                    const tagElts = querySelectorAll('a.post_tag', postElt);
                    const tags = tagElts.map(elt => elt.textContent.trim());

                    return {
                        url: highResImgUrl || mediaUrl,
                        previewUrl: mediaUrl,
                        siteName,
                        sourceUrl,
                        author,
                        siteFilename,
                        filename,
                        extension: ext,
                        submissionId,
                        title: '', // Tumblr really doesn't have the notion of titles
                        description,
                        tags,
                    }
                }
            }
        }
        else {
            let highResImgUrl: string = null;
            let siteFilename: string = null;

            if (mediaType === MediaType.Image) {
                // We're probably on an individual tumblog; let's try to get metadata from OpenGraph tags
                // Find the image URL that matches the one that got clicked
                const mediaUrlRoot = getImageUrlRoot(mediaUrl);
                const metaOgImages = querySelectorAll("meta[property='og:image']");
                const metaOgImage = metaOgImages.find(meta => getImageUrlRoot(meta.getAttribute('content')) === mediaUrlRoot);
                highResImgUrl = metaOgImage && metaOgImage.getAttribute('content');
            }

            siteFilename = new URL(highResImgUrl || mediaUrl).pathname.split('/').pop();
            const { filename, ext } = getFilenameParts(siteFilename);

            // We'll assume that the author is whoever's page we're on, which is a terrible assumption, but the best one we can make.
            const metaTwitterTitle = querySelector("meta[name='twitter:title']");
            const author = metaTwitterTitle ? metaTwitterTitle.getAttribute('content') : null;

            // Tumblr URLs (typically) look like this:
            // http://[username].tumblr.com/post/[id]/[title]
            const [, , submissionId] = window.location.pathname.split('/');

            const metaDescription = querySelector("meta[name='description']");
            const description = metaDescription ? metaDescription.getAttribute('content') : null;

            const metaKeywords = querySelector("meta[name='keywords']");
            const tags = metaKeywords ? metaKeywords.getAttribute('content').split(',') : [];

            return {
                url: highResImgUrl || mediaUrl,
                previewUrl: mediaUrl,
                siteName,
                author,
                siteFilename,
                filename,
                extension: ext,
                submissionId,
                title: '', // Tumblr really doesn't have the notion of titles
                description,
                tags,
            }
        }
    }
}

registerPlugin(TumblrPlugin, "tumblr.com");

function getImageUrlRoot(url: string) {
    // Tumblr image URLs are of the form
    // https://[##].media.tumblr.com/[UUID]/tumblr_[UUID]_[SIZE].png
    return url.substring(0, url.lastIndexOf('_'));
}