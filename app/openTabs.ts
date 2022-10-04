import * as I from './definitions';
import * as E from './enums';
import { TaskQueue, Task } from './utils/taskQueue';

const defaultDelaySecs = 1;

type OpenInTabsOptions = {
    windowId: number,
    switchToNewTab?: boolean
}


const TabOpenQueue = new TaskQueue({ delayBetweenItemsMs: 0 });

export default function openInTabs(pageList: I.PageLinkList, siteSettings: I.SiteSettings, options: OpenInTabsOptions) {
    // Filter out duplicates early so that the system has the correct list from the beginning
    let list = deduplicatePages(pageList.list);

    // TODO: if we want to support the old placeholder tab-style loading, here's where we'd do it. 
    // I think we should probably just deprecate the option; this mechanism works better overall and the other one isn't really tested anymore

    // override the switchToTab setting if there's already something being processed currently.
    const switchToNewTab = !TabOpenQueue.isRunning && options.switchToNewTab;

    if (pageList.sortable && siteSettings.tabLoadSortBy === E.TabLoadOrder.Date) {
        list.sort((a, b) => parseInt(a.submissionId) - parseInt(b.submissionId));
    }
    if (!siteSettings.tabLoadSortAsc) {
        list.reverse();
    }
    const delaySecs = siteSettings.tabLoadDelay || defaultDelaySecs;

    list.forEach((media, idx) => {
        const task = new Task(async () => {
            return browser.tabs.create({
                url: media.url,
                active: switchToNewTab && idx === 0,
                windowId: options.windowId,
            })
        }, delaySecs * 1000);
        TabOpenQueue.enqueue(task);
    });
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
