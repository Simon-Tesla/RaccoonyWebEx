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
        logger.log("hf: isStory?", isStory);

        const { author, submissionId, siteFilename, url } = isStory ? getStoryDetails() : getImageDetails();
        logger.log("hf: author, id, filename, url", author, submissionId, siteFilename, url);

        if (!url) {
            return Promise.resolve(null);
        }

        let { filename, ext } = getFilenameParts(siteFilename);
        logger.log("hf: filename, ext", filename, ext);
        if (!isStory) {
            // Image filenames have the username and ID in them, story PDFs do not.
            const [, , ...fileParts] = filename.split('-');
            filename = fileParts.join('-');
            logger.log("hf: not a story, filename", filename);
        }

        // Title is: "[Title] by [user] - Hentai Foundry
        const title = document.title.substr(0, document.title.lastIndexOf(' by '))
        logger.log("hf: title", title);

        const tagsElt = querySelector('meta[name=keywords]');
        logger.log("hf: tag element", tagsElt);
        const tags = tagsElt
            ? tagsElt.getAttribute('content').split(' ')
            : [];
        logger.log("hf: tags", tags);

        const descriptionElt = querySelector('.picDescript') || querySelector('.storyDescript');
        logger.log("hf: desc element", descriptionElt);
        const description = descriptionElt ? descriptionElt.innerText : '';
        logger.log("hf: description", description);

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
    logger.log("hf story: pdfLink?", pdfLink);
    if (pdfLink) {
        const url = pdfLink.href;
        const path = pdfLink.pathname;
        const [, , , author, submissionId, siteFilename] = path.split('/');
        logger.log("hf story: url, path, author, id, filename", url, path, author, submissionId, siteFilename);
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
    logger.log("hf image: imgElt", imgElt);
    if (imgElt) {
        let url = imgElt.src;

        // is it a thumbnail?  if so, get the URL of the full image from the onClick handler
        const isThumb = url.lastIndexOf("thumbs.hentai-foundry.com");
        if (isThumb > -1) {
            const onClick = imgElt.attributes.getNamedItem('onclick');
            logger.log("hf image: onclick", onClick);
            if (onClick) {
                // value will be something like
                // "this.src='//pictures.hentai-foundry.com/[u]/[username]/[id]/[username]-[id]-[filename]'; $('#resize_message').hide();"
                // parse out the URL from the this.src= , add protocol, and set url to that
                const value = onClick.value;
                const urlStart = value.indexOf("//pictures.hentai-foundry.com");
                const urlEnd = value.indexOf("'; $('#resize_message");
                url = window.location.protocol + value.slice(urlStart, urlEnd);
                logger.log("hf image: start, end, url from onclick", urlStart, urlEnd, url);
            }
        }

        logger.log("hf image: url is ", url);

        const imgPath = new URL(url).pathname;
        const [, , author, submissionId, siteFilename] = imgPath.split('/');
        logger.log("hf image: url, path, author, id, filename", url, imgPath, author, submissionId, siteFilename);
        return {
            author,
            submissionId,
            siteFilename,
            url
        };
    }
    return {};
}
