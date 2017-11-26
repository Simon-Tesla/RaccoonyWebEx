import * as I from '../definitions';
import { default as BaseSitePlugin, querySelector, querySelectorAll, getFileTypeByExt, getPageLinksFromAnchors, getFilenameParts } from './base';

const serviceName = "hiccears";

export class HiccearsPlugin extends BaseSitePlugin {
    readonly siteName: string = serviceName;

    getMedia(): Promise<I.Media> {
        // Get the username
        let profileLink = querySelector('h4 a[href^="./artist-profile"]');
        let username = profileLink && profileLink.textContent;

        // Get the filename
        let titleElt = querySelector(".panel-heading a");
        let filename = titleElt && titleElt.textContent;

        // Get the preview image
        // Preview image URLs look like this:
        // /upl0ads/covers/[code].png
        let previewImg: HTMLImageElement = querySelector('.panel-body img[src^="./upl0ads"]');
        let previewUrl = '';
        let ext = '';
        if (previewImg.classList.contains('img-thumbnail')) {
            //This is actually a gallery thumbnail, not a full image. Ignore it.
            return Promise.resolve(null);
        }
        if (previewImg) {
            let previewImgUrl = new URL(previewImg.src);
            ext = previewImgUrl.pathname.split('.').pop();
            previewUrl = previewImgUrl.href;
        }

        // Get the full-sized image; should be the link parent of the preview image.
        let fullSizeLink = <HTMLAnchorElement>(previewImg.parentElement);
        let url = (fullSizeLink && fullSizeLink.href) || previewUrl;

        // Get the id
        let pageUrl = new URL(window.location.href);
        let id = pageUrl.searchParams.get('pid');

        let title = titleElt && titleElt.textContent;
        let descriptionElt = document.querySelectorAll('.col-md-10 .panel-body')[1];
        let description = descriptionElt && descriptionElt.textContent.trim();
        let tags: string[] = [];

        let media: I.Media = {
            url: url,
            previewUrl: url,
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

        return Promise.resolve(media);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        let linkList: HTMLAnchorElement[] = querySelectorAll('.panel-body .col-md-3 a');
        let list = getPageLinksFromAnchors(linkList, (href) => {
            let url = new URL(href);
            return url.searchParams.get('pid');
        });

        let pageLinks: I.PageLinkList = {
            list: list,
            sortable: true
        };
        return Promise.resolve(pageLinks);
    }
}
