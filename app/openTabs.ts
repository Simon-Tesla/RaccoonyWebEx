import * as I from './definitions';
import * as E from './enums';

const defaultDelaySecs = 1;

export default function openInTabs(pageList: I.PageLinkList, settings: I.SiteSettings) {
    let list = pageList.list;
    if (pageList.sortable && settings.tabLoadSortBy === E.TabLoadOrder.Date) {
        list.sort((a, b) => parseInt(a.submissionId) - parseInt(b.submissionId));
    }
    if (!settings.tabLoadSortAsc) {
        list.reverse();
    }

    const delaySecs = settings.tabLoadDelay || defaultDelaySecs;
    list.forEach((page, idx) => {
        if (settings.tabLoadType === E.TabLoadType.Timer) {
            openMediaInTabAfterDelay(page, (idx * delaySecs));
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

function openMediaInTabAfterDelay(media: I.PageLink, delay: number) {
    // Opens the page in the current active window after the specified delay.
    // TODO: Need to check whether the requesting has been closed, or have a page or UI that can pause/stop the process
    setTimeout(() => {
        browser.tabs.create({
            url: media.url,
            active: false,
        })
    }, delay * 1000);
}