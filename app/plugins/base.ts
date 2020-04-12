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

