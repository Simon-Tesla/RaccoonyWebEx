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

    list.forEach((page, idx) => {
        let delaySecs = settings.tabLoadDelay || defaultDelaySecs;
        openMediaInTab(page, idx * defaultDelaySecs);
    });
}

function openMediaInTab(media: I.PageLink, delay: number) {
    let url = delay === 0
        ? media.url
        : `${browser.extension.getURL("delayload.html")}?url=${encodeURIComponent(media.url)}&delay=${delay}`;
    return browser.tabs.create({
        url: url,
        active: false,
    })
}