import * as I from '../definitions';
import { default as BaseSitePlugin, querySelector, querySelectorAll, getFileTypeByExt, getPageLinksFromAnchors, getFilenameParts } from './base';
import * as logger from '../logger';

const serviceName = "patreon";

export class PatreonPlugin extends BaseSitePlugin {
    readonly siteName: string = serviceName;

    getMedia(): Promise<I.Media> {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                try {
                    // Get the post image
                    let image: HTMLImageElement = querySelector(".patreon-creation-shim--image") ||
                        querySelector("[data-test-tag=post-card] img");
                    if (!image) {
                        resolve(null)
                        return;
                    }
                    let url = new URL(image.src);

                    // Patreon image URLs look like so:
                    // https://cdn3.patreon.com/1/patreon.posts/#####.jpg?v=####                    
                    let extIndex = url.pathname.lastIndexOf(".");
                    let ext = url.pathname.substring(extIndex + 1);

                    // Get the filename
                    // Patreon page URLs look like so:
                    // https://www.patreon.com/posts/[filename]-[id]
                    let pageUrlSlug = window.location.pathname.split('/').pop();
                    let slugParts = pageUrlSlug.split('-');
                    let id = slugParts.length > 0 ? slugParts.pop() : pageUrlSlug;
                    let filename = slugParts.length > 0 ? slugParts.join('-') : pageUrlSlug;

                    // Get the username
                    let titleParts = document.title.split('|');
                    let username = titleParts[1];
                    let trimIdx = username.lastIndexOf(' on Patreon');
                    username = username.substring(0, trimIdx).trim();

                    let title = titleParts[0].trim();
                    let descriptionElt = querySelector(".patreon-creation-shim--text--body") ||
                        querySelector("[class$='Post--postContentWrapper text']");
                    let description = (descriptionElt && descriptionElt.textContent.trim()) || '';
                    let tags = querySelectorAll("[class$='Post--postTags'] a")
                        .map(elt => elt.textContent);

                    let media: I.Media = {
                        url: url.href,
                        previewUrl: url.href,
                        author: username,
                        filename: filename,
                        extension: ext,
                        type: getFileTypeByExt(ext),
                        submissionId: id,
                        service: serviceName,
                        title: title,
                        description: description,
                        tags: tags
                    };
                    resolve(media);
                } catch (e) {
                    // swallow errors
                    logger.error("patreon", e.message, e);
                    reject(e);
                }
            }, 500);
        });
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        let itemLinks: HTMLAnchorElement[] = querySelectorAll('div[data-test-tag=post-card] a[class$="components-PostHeader--timestampLink"]');
        let list = getPageLinksFromAnchors(itemLinks, href => href.split('-').pop())
            .filter((item) => new URL(item.url).pathname.indexOf("/bePatron") !== 0)

        let pageList: I.PageLinkList = {
            list: list,
            sortable: true,
        }
        return Promise.resolve(pageList);
    }
}
