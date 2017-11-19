import * as I from './definitions';

const delaySecs = 1;

export default function openInTabs(pageList: I.PageLinkList) {
    let list = pageList.list;
    if (pageList.sortable) {
        // TODO: add sorting functionality
    }
    list.forEach((page, idx) => {
        // TODO: configurable delay
        openMediaInTab(page, idx * delaySecs);
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