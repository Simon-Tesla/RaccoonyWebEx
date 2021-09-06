import * as I from './definitions';
import * as E from './enums';
import * as logger from './logger';
import allSettled from '@ungap/promise-all-settled';

const defaultDelaySecs = 1;

type OpenInTabsOptions = {
    windowId: number,
}

if (!Promise.allSettled) {
    // Apply the polyfill if the browser doesn't support allSettled
    Promise['allSettled'] = allSettled;
}

interface TabOpeningCollection {
    /** The list of pages that are part of this collection of tabs */
    pageList: I.PageLinkList;


    /** A promise that is resolved once all tabs in this collection have been opened, or null if start() hasn't been called. */
    promise: Promise<unknown> | null;

    /** True if this collection of tabs has finished opening (i.e. the promise has resolved) */
    finished: boolean;

    /** A function to start opening this list of tabs */
    start: () => Promise<unknown>;
}

const OpenTabQueue: TabOpeningCollection[] = [];
let CurrentOpenTab: TabOpeningCollection = null;

export default function openInTabs(pageList: I.PageLinkList, siteSettings: I.SiteSettings, options: OpenInTabsOptions) {
    // Filter out duplicates early so that the system has the correct list from the beginning
    pageList.list = deduplicatePages(pageList.list);

    const collection: TabOpeningCollection = {
        pageList,
        promise: null,
        finished: false,
        start() {
            if (!this.promise) {
                this.promise = openListOfTabs(this.pageList, siteSettings, options).then(() => this.finished = true);
            }
            return this.promise;
        },
    };
    
    OpenTabQueue.push(collection);
    processQueue();
}

function processQueue() {
    if (CurrentOpenTab && !CurrentOpenTab.finished) {
        logger.debug("[processQueue] already executing existing openInTabs request", { current: CurrentOpenTab, queueLen: OpenTabQueue.length });
    }
    else {
        const next = OpenTabQueue.shift();
        if (!next) { 
            // Empty queue
            logger.debug("[processQueue] queue empty");
            return;
        }

        // Add the next item to the processing queue
        logger.debug("[processQueue] processing next set of tabs", { current: next, queueLen: OpenTabQueue.length });
        CurrentOpenTab = next;
        next.start().then(() => {
            // No need to hang on to this once we're finished processing it
            CurrentOpenTab = null;
            processQueue();
        });
    }
}

function openListOfTabs(pageList: I.PageLinkList, siteSettings: I.SiteSettings, options: OpenInTabsOptions): Promise<unknown> {
    let list = pageList.list;
    if (pageList.sortable && siteSettings.tabLoadSortBy === E.TabLoadOrder.Date) {
        list.sort((a, b) => parseInt(a.submissionId) - parseInt(b.submissionId));
    }
    if (!siteSettings.tabLoadSortAsc) {
        list.reverse();
    }
    const delaySecs = siteSettings.tabLoadDelay || defaultDelaySecs;

    const promises = list.map((page, idx) => {
        if (siteSettings.tabLoadType === E.TabLoadType.Timer) {
            return openMediaInTabAfterDelay(page, (idx * delaySecs), options);
        }
        else {
            return openMediaInPlaceholderTab(page, (idx * delaySecs));
        }
    });
    return Promise.allSettled(promises);
}

function deduplicatePages(list: I.PageLink[]) {
    // Filter to only unique URLs; there's no use for opening multiple tabs with the same URL.
    const pageUrls = new Set<string>();
    return list.filter(page => {
        if (pageUrls.has(page.url)) {
            return false;
        }
        else {
            pageUrls.add(page.url);
            return true;
        }
    });
}

function openMediaInPlaceholderTab(media: I.PageLink, delay: number): Promise<unknown> {
    // If the delay is > 0, opens a placeholder tab that will eventually load the real page.
    let url = delay === 0
        ? media.url
        : `${browser.extension.getURL("delayload.html")}?url=${encodeURIComponent(media.url)}&delay=${delay}`;
    return browser.tabs.create({
        url: url,
        active: false,
    })
}

function openMediaInTabAfterDelay(media: I.PageLink, delay: number, options: OpenInTabsOptions): Promise<unknown> {
    // Opens the page in the specified window after the specified delay.
    return new Promise<unknown>((resolve, reject) => {
        setTimeout(() => {
            browser.tabs.create({
                url: media.url,
                active: false,
                windowId: options.windowId,
            }).then(resolve, reject);
        }, delay * 1000);
    });
}
