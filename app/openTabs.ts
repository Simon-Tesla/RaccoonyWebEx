import * as I from './definitions';
import * as E from './enums';

const defaultDelaySecs = 1;

type OpenInTabsOptions = {
    windowId: number,
}

export default function openInTabs(pageList: I.PageLinkList, siteSettings: I.SiteSettings, options: OpenInTabsOptions) {
    let list = pageList.list;
    if (pageList.sortable && siteSettings.tabLoadSortBy === E.TabLoadOrder.Date) {
        list.sort((a, b) => parseInt(a.submissionId) - parseInt(b.submissionId));
    }
    if (!siteSettings.tabLoadSortAsc) {
        list.reverse();
    }

    const delaySecs = siteSettings.tabLoadDelay || defaultDelaySecs;
    list.forEach((page, idx) => {
        if (siteSettings.tabLoadType === E.TabLoadType.Timer) {
            openMediaInTabAfterDelay(page, (idx * delaySecs), options);
        }
        else {
            openMediaInPlaceholderTab(page, (idx * delaySecs));
        }
    });
}

function openMediaInPlaceholderTab(media: I.PageLink, delay: number) {
    // If the delay is > 0, opens a placeholder tab that will eventually load the real page.
    let url = delay === 0
        ? media.url
        : `${browser.extension.getURL("delayload.html")}?url=${encodeURIComponent(media.url)}&delay=${delay}`;
    return browser.tabs.create({
        url: url,
        active: false,
    })
}

function openMediaInTabAfterDelay(media: I.PageLink, delay: number, options: OpenInTabsOptions) {
    // Opens the page in the specified window after the specified delay.
    setTimeout(() => {
        browser.tabs.create({
            url: media.url,
            active: false,
            windowId: options.windowId,
        })
    }, delay * 1000);
}