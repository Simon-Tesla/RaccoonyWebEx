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

//TODO: should probably move these somewhere else
export function querySelectorAll<T extends HTMLElement>(selector: string, scope?: HTMLElement): T[] {
    let list = <NodeListOf<T>>((scope || document).querySelectorAll(selector));
    return Array.from(list);
}

export function querySelector<T extends HTMLElement>(selector: string, scope?: HTMLElement): T {
    return <T>((scope || document).querySelector(selector));
}

const MinimumImageElementSizeThreshold = 300 * 300;

export function getLargestImageElement(thresholdPx: number = MinimumImageElementSizeThreshold, selector: string | HTMLElement = document.body) {
    let candidates: HTMLImageElement[];
    if (typeof selector === 'string') {
        candidates = Array.from(document.querySelectorAll(selector + ' img'));
    }
    else {
        candidates = Array.from(selector.getElementsByTagName('img'));
    }
    let largestImg = null;
    let imgSize = thresholdPx;
    candidates.forEach((img) => {
        const currSize = img.naturalWidth * img.naturalHeight;
        if (currSize > imgSize) {
            largestImg = img;
            imgSize = currSize
        }
    });
    return largestImg;
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

let fileTypes: [MediaType, string[]][] = [
    [MediaType.Image, ['jpg', 'jpeg', 'png', 'gif']],
    [MediaType.Text, ['txt', 'rtf', 'doc', 'docx', 'odf']],
    [MediaType.Flash, ['swf']],
    [MediaType.Video, ['mpeg', 'mpg', 'mp4', 'avi', 'divx', 'mkv', 'flv', 'mov', 'wmv']],
    [MediaType.Audio, ['wav', 'mp3', 'm4a', 'flac', 'ogg', 'wma']]
];

// Create extension to type mapping
let extensionToTypeMap = (() => {
    let extMap: { [ext: string]: MediaType } = {};
    fileTypes.forEach(typeTuple => {
        const [type, extensions] = typeTuple;
        extensions.forEach(ext => {
            extMap[ext] = type;
        })
    })
    return extMap;
})();

export function getFileTypeByExt(ext: string): MediaType {
    return extensionToTypeMap[ext] || MediaType.Unknown;
}