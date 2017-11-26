import * as I from '../definitions';
import { default as BaseSitePlugin, querySelector, querySelectorAll, getFileTypeByExt, getPageLinksFromAnchors, getFilenameParts } from './base';

const serviceName = "e621";

export class E621Plugin extends BaseSitePlugin {
    readonly siteName: string = serviceName;

    getMedia(): Promise<I.Media> {
        // Get the download button
        let button = document.getElementById("image");

        // Get the URL
        // e621 image URLs are of the format
        // https://static1.e621.net/data/99/c5/99c5a9f2195e8025df8e03acef6e2b2f.png
        let url = button && button.getAttribute("src");
        if (!url) {
            return Promise.resolve(null);
        }

        // Get the artist's name
        let usernameElt = querySelector(".tag-type-artist a[href^='/post/search']");
        let username = usernameElt && usernameElt.textContent || "unknown";

        // Get the filename
        // e612 submission pages are of the format:
        // https://e621.net/post/show/[id]/[tags?]
        let pathParts = window.location.pathname.split('/');
        let id = pathParts[3];

        let descriptionElt = querySelector("#content .collapse-body");
        let description = (descriptionElt && descriptionElt.textContent) || '';
        description = description.trim();

        let tags: string[] = querySelectorAll(".tag-type-artist a[href^='/post/search'], .tag-type-character a[href^='/post/search'], .tag-type-copyright a[href^='/post/search'], .tag-type-species a[href^='/post/search'], .tag-type-general a[href^='/post/search']")
            .map((el) => el.textContent.trim());

        // Compose a filename using the tag slug, if possible.
        let serviceFilename = url.split('/').pop();
        let filename = pathParts[4] || tags.slice(0, 3).join("_");
        let extIndex = url.lastIndexOf(".");
        let ext = url.substring(extIndex + 1);

        let media: I.Media = {
            url: url,
            previewUrl: url,
            author: username,
            serviceFilename: serviceFilename,
            filename: filename,
            extension: ext,
            type: getFileTypeByExt(ext),
            submissionId: id,
            service: serviceName,
            title: null,
            description: description,
            tags: tags
        };

        return Promise.resolve(media);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        let links: HTMLAnchorElement[] = querySelectorAll("#content .thumb a");
        let list = getPageLinksFromAnchors(links, href => {
            let urlparts = href.split('/');
            urlparts.pop();
            return urlparts.pop();
        });
        let res: I.PageLinkList = {
            list: list,
            sortable: false,
        }
        return Promise.resolve(res);
    }
}
