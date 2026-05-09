import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import { getFilenameParts } from '../utils/file';
import { MediaType } from '../enums';

const serviceName = "subscribestar";

type SubstarMediaInfo = {
    /** ID is unique to the image, not the post */
    id: number,
    /** The upload filename */
    original_filename: string,
    /** Smaller preview used inline */
    gallery_preview_url: string,
    /** Larger preview used in the gallery view */
    preview_url: string,
    /** URL for the download/full-size image */
    url: string,
    width: number,
    height: number,
    content_type?: string,
    type: 'image' | 'video';
}

export class SubscribeStarPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName, "#root");
    }

    async getMedia(): Promise<I.Media | undefined> {        
        // Image submissions contain JSON of an array of items, either in the gallery lightbox itself under the data-items property
        // or in the 'div.uploads-images' element under data-gallery       
        const imageRollElt = querySelector('.gallery[data-items]') ?? querySelector('.uploads-images');
        const itemsJson = imageRollElt && (imageRollElt.dataset.items ?? imageRollElt.dataset.gallery)
        const mediaInfos: SubstarMediaInfo[] = (itemsJson && JSON.parse(itemsJson)) ?? [];
        if (!mediaInfos.length) {
            return;
        }

        // Default to the first mediaInfo if the gallery isn't open
        let mediaInfo = mediaInfos[0];

        // Use mediaInfo corresponding to the image shown in the gallery when using the carousel viewer
        const downloadLink = querySelector<HTMLAnchorElement>(['a.gallery-image_original_link', "a.gallery-download_icon"]);
        if (downloadLink) {
            // Handle cases with both relative and absolute URLs
            const downloadUrl = downloadLink.href;
            const downloadHref = downloadLink.getAttribute('href')
            mediaInfo = mediaInfos.find(info => info.url === downloadUrl || 
                info.url === downloadHref || 
                downloadUrl === new URL(info.url, window.location.href).href
            ) ?? mediaInfo;
        }

        // TODO: this logic is incorrect when attempting to download from a page with a list of multiple posts
        // rather than the individual post.
        // Also we should figure out context menu downloading while we're at it, so that we don't have to have the lightbox up to behave correctly.

        // Title may or may not exist
        const titleElt = querySelector('h1');
        const title = titleElt?.textContent.trim() ?? 'Untitled';
        const authorElt = querySelector('.star_link-name');
        const author = authorElt?.textContent.trim() ?? 'Unknown';
        // The description also contains the title element at the very beginning. 
        const descriptionElt = querySelector('.post-content');
        let description = descriptionElt?.textContent.trim() ?? '';
        if (description.startsWith(title)) {
            description = description.substring(title.length).trim();
        }

        const tagsElts = querySelectorAll('.post-tags a.post-tag');
        const tags = tagsElts.map(t => t.textContent.trim());

        return {
            siteName: serviceName,
            ...this.getMediaFromMediaInfo(mediaInfo),
            title,
            author,
            description,
            tags
        }
    }

    async getPageLinkList(): Promise<I.PageLinkList> {
        let itemLinks: HTMLAnchorElement[] = querySelectorAll('.posts .post .post-date a');
        let list = getPageLinksFromAnchors(itemLinks, href => href.split('/').pop());

        if (!itemLinks.length) {
            // Substar doesn't believe in making individual pages linkable in their post listings anymore
            // but they do at least have the post IDs in the DOM metadata.
            const posts = querySelectorAll('.posts .post');
            const postList = posts.map(postElt => {
                const submissionId = postElt.dataset.id;
                if (submissionId) {
                    const url = new URL(`/posts/${submissionId}`, window.location.href).href;
                    return {
                        url: url,
                        submissionId
                    } as I.PageLink
                }
            });
            list = postList.filter(item => !!item);
        }

        let pageList: I.PageLinkList = {
            list: list,
            sortable: true,
            infiniteScroll: true,
        }
        return pageList;
    }

    private getMediaFromMediaInfo(mediaInfo: SubstarMediaInfo): Pick<I.Media, 'submissionId' | 'siteFilename' | 'url' | 'previewUrl' | 'filename' | 'extension' | 'type'> {
        const siteFilename = mediaInfo.original_filename;
        const { filename, ext: extension } = getFilenameParts(siteFilename);
        const type = MediaTypeMap[mediaInfo.type];
        // Ensure absolute URLs
        const url = new URL(mediaInfo.url, window.location.href).href;
        const previewUrl = new URL(mediaInfo.url, window.location.href).href;
        return {
            url,
            previewUrl,
            submissionId: `${mediaInfo.id}`,
            siteFilename,
            filename,
            extension,
            type
        }
    }
}

const MediaTypeMap: Record<string, MediaType> = {
    'image': MediaType.Image,
    'video': MediaType.Video
}

registerPlugin(SubscribeStarPlugin, 'subscribestar.adult');
registerPlugin(SubscribeStarPlugin, 'subscribestar.com');