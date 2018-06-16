import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import * as logger from '../logger';
import { getFilenameParts } from '../utils/file';

const siteName = "hentaifoundry";

export class HentaiFoundryPlugin extends BaseSitePlugin {
    constructor() {
        super(siteName);
    }
    
    getMedia(): Promise<I.Media> {
        const isStory = window.location.pathname.startsWith('/stories');
        const { author, submissionId, siteFilename, url } = isStory ? getStoryDetails() : getImageDetails();

        if (!url) {
            return Promise.resolve(null);
        }

        let { filename, ext } = getFilenameParts(siteFilename);
        if (!isStory) {
            // Image filenames have the username and ID in them, story PDFs do not.
            const [, , ...fileParts] = filename.split('-');
            filename = fileParts.join('-');
        }

        // Title is: "[Title] by [user] - Hentai Foundry
        const title = document.title.substr(0, document.title.lastIndexOf(' by '))

        const tagsElt = querySelector('meta[name=keywords]');
        const tags = tagsElt
            ? tagsElt.getAttribute('content').split(' ')
            : [];

        const descriptionElt = querySelector('.picDescript') || querySelector('.storyDescript');
        const description = descriptionElt ? descriptionElt.innerText : '';

        const media: I.Media = {
            siteName,
            url,
            author,
            siteFilename,
            filename,
            extension: ext,
            submissionId,
            title,
            description,
            tags
        }
        return Promise.resolve(media);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        // Look for picture thumbnails first
        let itemLinks: HTMLAnchorElement[] = querySelectorAll('.thumbLink');
        if (itemLinks.length === 0) {
            // Look for story links next
            itemLinks = (querySelectorAll('.storyRow .titlebar a') as HTMLAnchorElement[])
                .filter((elt) => {
                    // Filter out any non-story links
                    return !(
                        elt.pathname === '/stories/addToFavorites' ||
                        elt.getAttribute('href') === '#' ||
                        elt.classList.contains('linkButton') ||
                        elt.href === window.location.href
                    )
                });
        }

        const list = getPageLinksFromAnchors(itemLinks, (href) => {
            // URL is in the format:
            // https://www.hentai-foundry.com/pictures/user/[user]/[id]/[filename]
            const [, , , , id] = new URL(href).pathname.split('/');
            return id;
        });
        
        let pageLinkList: I.PageLinkList = {
            list,
            sortable: true,
        }
        return Promise.resolve(pageLinkList);
    }
}

registerPlugin(HentaiFoundryPlugin, 'hentai-foundry.com');

function getStoryDetails() {
    // Story URLs look like this
    // https://pictures.hentai-foundry.com/stories/user/[username]/[id]/[filename].pdf
    const pdfLink = querySelector('.pdfLink') as HTMLAnchorElement;
    if (pdfLink) {
        const url = pdfLink.href;
        const path = pdfLink.pathname;
        const [, , , author, submissionId, siteFilename] = path.split('/');
        return {
            author,
            submissionId,
            siteFilename,
            url
        };
    }
    return {};
}

function getImageDetails() {
    // Submission URLs look like this:
    // https://pictures.hentai-foundry.com/[u]/[username]/[id]/[username]-[id]-[filename].[ext]
    const imgElt = querySelector('#picBox .boxbody img') as HTMLImageElement;
    if (imgElt) {
        const url = imgElt.src;
        const imgPath = new URL(url).pathname;
        const [, , author, submissionId, siteFilename] = imgPath.split('/');
        return {
            author,
            submissionId,
            siteFilename,
            url
        };
    }
    return {};
}
