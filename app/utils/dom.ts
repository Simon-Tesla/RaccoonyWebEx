import { PageLink } from "../definitions";

export function querySelectorAll<T extends HTMLElement>(selector: string, scope?: HTMLElement): T[] {
    let list = <NodeListOf<T>>((scope || document).querySelectorAll(selector));
    return Array.from(list);
}

export function querySelector<T extends HTMLElement>(selector: string, scope?: HTMLElement): T {
    return <T>((scope || document).querySelector(selector));
}

export function isElementVisible(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const vWidth = window.innerWidth || document.documentElement.clientWidth;
    const vHeight = window.innerHeight || document.documentElement.clientHeight;

    // Return true if it's in the viewport
    return !(rect.right < 0 || rect.bottom < 0 ||
        rect.left > vWidth || rect.top > vHeight)
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

type DomLinkSubmissionIdExtractor = (href: string, linkElt: HTMLAnchorElement) => string;

export function getPageLinksFromAnchors(links: HTMLAnchorElement[], getIdFromSubmissionUrl: DomLinkSubmissionIdExtractor = () => null): PageLink[] {
    return links.map(linkElt => {
        let href = linkElt.href;
        let id = getIdFromSubmissionUrl(href, linkElt);

        let link: PageLink = {
            url: href,
            submissionId: id,
        };
        return link;
    });
}

export function getPageLinksFromSelector(selector: string, getIdFromSubmissionUrl: DomLinkSubmissionIdExtractor = () => null): PageLink[] {
    const links: HTMLAnchorElement[] = querySelectorAll(selector);
    const list = getPageLinksFromAnchors(links, getIdFromSubmissionUrl);
    return list;
}