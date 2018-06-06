import * as I from '../definitions';
import { MediaType, TabLoadOrder } from '../enums';
import * as logger from '../logger';

export default abstract class BaseSitePlugin implements I.SitePlugin {
    siteName: string;

    private _pageChangeHandler: () => void = () => { };

    constructor(siteName: string, mutationSelector?: string) {
        this.siteName = siteName;

        logger.log('initializing plugin', this.siteName);
        if (mutationSelector) {
            let element = document.querySelector(mutationSelector);
            let observer = new MutationObserver((mutations, observer) => {
                if (mutations.some(mut => mut.addedNodes.length > 0) || mutations.some(mut => mut.removedNodes.length > 0)) {
                    this.notifyPageChange();
                }
            });
            observer.observe(element, { childList: true, subtree: true });
        }
    }

    getMedia(): Promise<I.Media> {
        return Promise.resolve(null);
    }

    getMediaForSrcUrl(srcUrl: string): Promise<I.Media> {
        throw new Error("Method not implemented.");
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        return Promise.resolve(null);
    }

    hasMedia(): Promise<boolean> {
        return this.getMedia()
            .then(media => media && !!media.url);
    }

    hasPageLinkList(): Promise<boolean> {
        return this.getPageLinkList()
            .then(list => list && list.list.length > 0);
    }

    registerPageChangeHandler(handler: () => void): void {
        this._pageChangeHandler = handler;
    }

    protected notifyPageChange() {
        logger.log('notifying page change')
        this._pageChangeHandler && this._pageChangeHandler();
    }
}

const pluginRegistry = new Map<string, { new(): I.SitePlugin }>();

export function registerPlugin(plugin: { new(): I.SitePlugin; }, hostnameToMatch: string) {
    pluginRegistry.set(hostnameToMatch, plugin);
}

export function getSitePlugin(hostname: string): I.SitePlugin {
    let plugin = pluginRegistry.get(hostname);

    if (!plugin) {
        for (let [key, val] of pluginRegistry) {
            if (hostname.endsWith(key)) {
                plugin = val;
                break;
            }
        }
    }
    return plugin && new plugin();
}

//TODO: should probably move these somewhere else
export function querySelectorAll<T extends HTMLElement>(selector: string, scope?: HTMLElement): T[] {
    let list = <NodeListOf<T>>((scope || document).querySelectorAll(selector));
    return Array.from(list);
}

export function querySelector<T extends HTMLElement>(selector: string, scope?: HTMLElement): T {
    return <T>((scope || document).querySelector(selector));
}

const MinimumImageElementSizeThreshold = 300 * 300;

export function getLargestImageElement(thresholdPx: number = MinimumImageElementSizeThreshold, selector: string | HTMLElement = document.body) {
    let candidates: HTMLImageElement[];
    if (typeof selector === 'string') {
        candidates = Array.from(document.querySelectorAll(selector + ' img'));
    }
    else {
        candidates = Array.from(selector.getElementsByTagName('img'));
    }
    let largestImg = null;
    let imgSize = thresholdPx;
    candidates.forEach((img) => {
        const currSize = img.naturalWidth * img.naturalHeight;
        if (currSize > imgSize) {
            largestImg = img;
            imgSize = currSize
        }
    });
    return largestImg;
}

export function getPageLinksFromAnchors(links: HTMLAnchorElement[], getIdFromSubmissionUrl: (href: string) => string): I.PageLink[] {
    return links.map(linkElt => {
        let href = linkElt.href;
        let id = getIdFromSubmissionUrl(href);

        let link: I.PageLink = {
            url: href,
            submissionId: id,
        };
        return link;
    });
}

