import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors, getLargestImageElement, getFirstNonBodyAncestorElement } from '../utils/dom';
import * as logger from '../logger';
import { isValidExtensionForType, isValidExtension } from '../utils/file';
import { MediaType } from '../enums';

const serviceName = "patreon";

export class PatreonPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName, '#__next, [data-reactroot]');
    }

    async getMediaForSrcUrl(mediaUrl: string, mediaType: MediaType): Promise<I.Media> {
        return {
            url: mediaUrl,
            previewUrl: mediaUrl,
            siteName: serviceName,
            ...this.getFilenameAndId(mediaUrl),
            ...this.getGlobalPostMetadata(),
        }
    }

    async getMedia(): Promise<I.Media> {
        // TODO: Patreon currently hides a wealth of data in a JSON blob in script#__NEXT_DATA__
        // This may be a very useful source of data to scrape, depending on how stable the schema is
        // Most of the interesting data exists in props.pageProps.bootstrapEnvelope.bootstrap.post
        // 'data' contains metadata for the post itself,
        // 'included' contains info on the media inside the post (among other things) - the full-size 
        // image URLs appear to be represented here and are referenced by an ID number.
        try {
            // Check to see if the patreon lightbox is open and use that image first, when possible.
            let mediaElt: HTMLImageElement | HTMLAudioElement = querySelector('img[data-tag=lightboxImage]');
            if (mediaElt) {
                // Register the lightbox for change handling
                const parent = getFirstNonBodyAncestorElement(mediaElt);
                this.observeElementForChanges(parent);                
            } else {
                // Get the post image
                mediaElt = 
                    // New 2023 Patreon layout
                    // Look for audio players before looking for images
                    querySelector('audio[tag=audio-player]')
                    || querySelector("[data-tag=post-card] audio")
                    || querySelector('[data-tag=post-card] img')
                    // Old Patreon layout
                    || querySelector(".patreon-creation-shim--image");

                if (!mediaElt && window.location.pathname.startsWith('/posts/')) {
                    // Since Patreon uses some CSS module library that munges things like class names,
                    // this can be hard to scrape. In the worst case, fall back to the largest image on the page.
                    mediaElt = getLargestImageElement();
                }
            }

            if (!mediaElt) {
                return null;
            }
            const mediaUrl = mediaElt.src;

            return {
                url: mediaUrl,
                previewUrl: mediaUrl,
                siteName: serviceName,
                ...this.getFilenameAndId(mediaUrl),
                ...this.getGlobalPostMetadata(),
            }
        } catch (e) {
            logger.error("patreon", e.message, e);
            throw e;
        }
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        let itemLinks: HTMLAnchorElement[] = querySelectorAll('div[data-test-tag=post-card] a[class$="components-PostHeader--timestampLink"]');
        if (itemLinks.length === 0) {
            itemLinks = querySelectorAll('[data-tag=post-card] [data-tag=post-title] a');
        }
        if (itemLinks.length === 0) {
            itemLinks = querySelectorAll('a[href^="/posts/]');
        }

        // Filter any extraneous links.
        itemLinks = itemLinks.filter(link => !(new URL(link.href).pathname.startsWith("/bePatron")));

        // Remove any duplicate links.
        const urlMap = new Map<string, HTMLAnchorElement>();
        itemLinks.forEach(link => {
            let url = link.href;
            if (!urlMap.has(url)) {
                urlMap.set(url, link)
            }
        });

        itemLinks = Array.from(urlMap.values());

        let list = getPageLinksFromAnchors(itemLinks, href => href.split('-').pop());

        let pageList: I.PageLinkList = {
            list: list,
            sortable: true,
        }
        return Promise.resolve(pageList);
    }

    
    private getTags() {
        let tagsElts = querySelectorAll("[data-tag=post-tags] a");
        return tagsElts.map(elt => elt.textContent);
    }

    private getPostMetadataJson() {
        // Note: there are multiple matching tags of this type. 
        // The first one should contain the description, but for resiliancy we'll do some basic duck typing.
        const jsonScriptElts = querySelectorAll('script[type="application/ld+json"]');
        for (const scriptElt of jsonScriptElts) {
            const res = JSON.parse(scriptElt.textContent);
            if (res.author && res.description) {
                return res as {
                    author: { name: string },
                    name: string,
                    description: string
                };
            }
        }
    }

    private getGlobalPostMetadata(): Pick<I.Media, 'title' | 'author' | 'description' | 'tags'> {
        const metadata = this.getPostMetadataJson();
        const tags = this.getTags();
        if (metadata) {
            return {
                author: metadata.author.name,
                title: metadata.name,
                description: metadata.description,
                tags
            }
        }
        else {
            // Fall back to Open Graph tags if we couldn't find the metadata
            // Format: "[Title] | [Creator]"
            const ogTitle = querySelector('meta[property="og:title"]')?.getAttribute('content');
            const titleParts = ogTitle.split('|');
            return {
                author: titleParts[1].trim(),
                title: titleParts[0].trim(),
                description: '', // The description is in an element not marked with any easy to scrape class names. 
                tags
            }
        }
    }

    private getFilenameAndId(urlSrc: string): Pick<I.Media, 'filename' | 'extension' | 'submissionId'> {
        // Patreon image URLs usually look like so:
        // https://c10.patreonusercontent.com/4/patreon-media/p/post/[submissionId]/[mediaId]/[base64encodedJSON]/1.[ext]?token-time=[###]&token-hash=[###]"            
        let url = new URL(urlSrc);
        let extIndex = url.pathname.lastIndexOf(".");
        let extension = url.pathname.substring(extIndex + 1);
        // Some newer patreon URLs don't contain extensions in them; leave it null if it doesn't
        if (extension && (extIndex > -1 || !isValidExtension(extension))) {
            extension = null;
        }

        const pathParts = url.pathname.split('/');
        const mediaId = pathParts[6];

        // Patreon page URLs look like so:
        // https://www.patreon.com/posts/[filename]-[id]
        let pageUrlSlug = window.location.pathname.split('/').pop();
        let slugParts = pageUrlSlug.split('-');
        let submissionId = slugParts.length > 0 ? slugParts.pop() : pageUrlSlug;
        let filename = slugParts.length > 0 ? slugParts.join('-') : pageUrlSlug;

        return {
            filename,
            extension,
            // Need to concatenate the submissionId to the mediaId as the submissionId is not unique for a multi-image submission.
            submissionId: `${submissionId}_${mediaId}`
        }
    }
}

registerPlugin(PatreonPlugin, 'patreon.com');