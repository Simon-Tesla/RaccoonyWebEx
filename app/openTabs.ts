import * as I from './definitions';

const delaySecs = 1;

export default function openInTabs(mediaList: I.MediaList) {
    let list = mediaList.list;
    if (mediaList.sortable) {
        // TODO: add sorting functionality
    }
    list.forEach((media, idx) => {
        // TODO: configurable delay
        openMediaInTab(media, idx * delaySecs);
    });
}

function openMediaInTab(media: I.Media, delay: number) {
    let url = delay === 0
        ? media.url
        : `${browser.extension.getURL("delayload.html")}?url=${encodeURIComponent(media.url)}&delay=${delay}`;
    return browser.tabs.create({
        url: url,
        active: false,
    })
}