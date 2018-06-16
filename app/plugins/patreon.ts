import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors, getLargestImageElement } from '../utils/dom';
import * as logger from '../logger';

const serviceName = "patreon";

export class PatreonPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName, '#reactTarget');
    }

    getMedia(): Promise<I.Media> {
        return new Promise(function (resolve, reject) {
            try {
                // Get the post image
                let image: HTMLImageElement = querySelector(".patreon-creation-shim--image") ||
                    querySelector("[data-test-tag=post-card] img") ||
                    querySelector("[data-tag=post-card] img");

                if (!image && window.location.pathname.startsWith('/posts/')) {
                    // Since Patreon uses some CSS module library that munges things like class names,
                    // this can be hard to scrape. In the worst case, fall back to the largest image on the page.
                    image = getLargestImageElement();
                }

                if (!image) {
                    resolve(null)
                    return;
                }
                let url = new URL(image.src);

                // Patreon image URLs look like so:
                // https://cdn3.patreon.com/1/patreon.posts/#####.jpg?v=####                    
                let extIndex = url.pathname.lastIndexOf(".");
                let ext = url.pathname.substring(extIndex + 1);

                // Get the filename
                // Patreon page URLs look like so:
                // https://www.patreon.com/posts/[filename]-[id]
                let pageUrlSlug = window.location.pathname.split('/').pop();
                let slugParts = pageUrlSlug.split('-');
                let id = slugParts.length > 0 ? slugParts.pop() : pageUrlSlug;
                let filename = slugParts.length > 0 ? slugParts.join('-') : pageUrlSlug;

                // Get the username
                let titleParts = document.title.split('|');
                let username = titleParts[1];
                let trimIdx = username.lastIndexOf(' on Patreon');
                username = username.substring(0, trimIdx).trim();

                let title = titleParts[0].trim();
                let descriptionElt = querySelector(".patreon-creation-shim--text--body") ||
                    querySelector("[class$='Post--postContentWrapper text']") ||
                    querySelector("[data-tag=post-content]");
                let description = (descriptionElt && descriptionElt.textContent.trim()) || '';
                let tagsElts = querySelectorAll("[class$='Post--postTags'] a");
                tagsElts = tagsElts.length > 0 ? tagsElts : querySelectorAll("[data-tag=post-tags] a");
                let tags = tagsElts.map(elt => elt.textContent);

                let media: I.Media = {
                    url: url.href,
                    previewUrl: url.href,
                    author: username,
                    filename: filename,
                    extension: ext,
                    submissionId: id,
                    siteName: serviceName,
                    title: title,
                    description: description,
                    tags: tags
                };
                resolve(media);
            } catch (e) {
                // swallow errors
                logger.error("patreon", e.message, e);
                reject(e);
            }
        });
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
}

registerPlugin(PatreonPlugin, 'patreon.com');