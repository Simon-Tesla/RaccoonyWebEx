import * as I from '../definitions';
import { MediaType } from '../enums';
import * as logger from '../logger';

export default abstract class BaseSitePlugin implements I.SitePlugin {
    abstract siteName: string;

    private _pageChangeHandler: () => void = () => { };

    constructor(mutationSelector?: string) {
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

    getPageLinkList(): Promise<I.PageLinkList> {
        return Promise.resolve(null);
    }

    hasMedia(): Promise<boolean> {
        return this.getMedia()
            .then(media => media && !!media.url);
            //.catch(err => {
            //    // Swallow errors
            //    console.error("[rc.hasMedia] error:", err);
            //    return Promise.resolve(false)
            //});
    }

    hasPageLinkList(): Promise<boolean> {
        return this.getPageLinkList()
            .then(list => list && list.list.length > 0);
            //.catch(err => {
            //    // Swallow errors
            //    console.error("[rc.hasMediaList] error:", err);
            //    return Promise.resolve(false)
            //});
    }

    registerPageChangeHandler(handler: () => void): void {
        this._pageChangeHandler = handler;
    }

    protected notifyPageChange() {
        this._pageChangeHandler && this._pageChangeHandler();
    }
}

//TODO: should probably move these somewhere else
export function querySelectorAll<T extends HTMLElement>(selector: string, scope?: HTMLElement): T[] {
    let list = <NodeListOf<T>>((scope || document).querySelectorAll(selector));
    return Array.from(list);
}

export function querySelector<T extends HTMLElement>(selector: string, scope?: HTMLElement): T {
    return <T>((scope || document).querySelector(selector));
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

export function getFilenameParts(filename: string) {
    const extIndex = filename.lastIndexOf(".");
    let ext = '';
    if (extIndex !== -1) {
        ext = filename.substring(extIndex + 1);
        filename = filename.substring(0, extIndex);

    }
    return {
        ext,
        filename,
    }
}

let extMap: { [ext: string]: MediaType } = {};
let fileTypes: string[][] = [];
fileTypes[MediaType.Image] = ['jpg', 'jpeg', 'png', 'gif'];
fileTypes[MediaType.Text] = ['txt', 'rtf', 'doc', 'docx', 'odf'];
fileTypes[MediaType.Flash] = ['swf'];
fileTypes[MediaType.Video] = ['mpeg', 'mpg', 'mp4', 'avi', 'divx', 'mkv', 'flv', 'mov', 'wmv'];
fileTypes[MediaType.Audio] = ['wav', 'mp3', 'm4a', 'flac', 'ogg', 'wma'];

// Create extension to type mapping
let type: MediaType;
fileTypes.forEach((extList, type: MediaType) => {
    for (let ext of extList) {
        extMap[ext] = type;
    }
});

export function getFileTypeByExt(ext: string): MediaType {
    return extMap[ext] || MediaType.Unknown;
}