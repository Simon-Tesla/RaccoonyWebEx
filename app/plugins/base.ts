import * as I from '../definitions';
import { MediaType, TabLoadOrder } from '../enums';
import * as logger from '../logger';
import { querySelectorAll } from '../utils/dom';

export default abstract class BaseSitePlugin implements I.SitePlugin {
    siteName: string;

    private _pageChangeHandler: () => void = () => { };

    private _observer: MutationObserver;
    private _observedElements = new Set<Element>();

    constructor(siteName: string, mutationSelector?: string) {
        this.siteName = siteName;

        logger.log('initializing plugin', this.siteName);
        // Do not allow a mutation selector of body or html, since this will catch updates to the Raccoony UI as well, leading to infinite loops.
        // In theory there's probably a way to filter that out even with this sort of selector but this will do for now.
        if (mutationSelector && mutationSelector.toLowerCase() !== 'body' && mutationSelector.toLowerCase() !== 'html') {
            this._observer = new MutationObserver((mutations, observer) => {
                if (mutations.some(mut => mut.addedNodes.length > 0) || mutations.some(mut => mut.removedNodes.length > 0)) {
                    this.notifyPageChange();
                }
            });
            let elements = querySelectorAll(mutationSelector);
            for (const el of elements) {
                this.observeElementForChanges(el);
            }
        }
    }

    getMedia(): Promise<I.Media> {
        return Promise.resolve(null);
    }

    checkFileDownload(): Promise<I.Media> {
        return this.getMedia();
    }

    getMediaForSrcUrl(srcUrl: string, mediaType: MediaType): Promise<I.Media> {
        return Promise.resolve(null);
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

    /** 
     * Registers additional areas of the page not available at load time for change monitoring.
     * If a plugin notices new DOM that should be monitored for changes, this can be used to add that monitoring.
    */
    protected observeElementForChanges(element: Element) {
        if (element === document.body) {
            logger.error('Cannot observe body element');
            return;
        }
        if (!this._observedElements.has(element)) {
            logger.log('observing new element', element);
            this._observedElements.add(element);
            this._observer.observe(element, { childList: true, subtree: true });
        }
    }
}

// The default plugin handles any site that doesn't have an explicit plugin written for it.
// Most of the actual logic for handling unknown pages will be delegated to the SiteActions class.
class DefaultPlugin extends BaseSitePlugin {
    constructor() {
        super(window.location.hostname);
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
    return plugin ? new plugin() : new DefaultPlugin();
}

