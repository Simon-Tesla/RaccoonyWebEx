import * as I from '../definitions';
import { default as BaseSitePlugin, querySelector, querySelectorAll, getFileTypeByExt, getPageLinksFromAnchors, getFilenameParts } from './base';

const serviceName = "inkbunny";

export default class InkbunnyPlugin extends BaseSitePlugin {
    getMedia(): Promise<I.Media> {
        // Check to see if we're on a submission page.
        if (!isSubmissionPage()) {
            return Promise.resolve(null);
        }

        let previewUrl = getPreviewImageUrl();
        let url = getImageUrl() || previewUrl;
        
        let serviceFilename = url.split('/').pop();
        let { filename, ext, id } = getOriginalFilenameParts(serviceFilename);
        let author = getAuthor();

        let title = getTitle();
        let description = getDescription();
        let tags = getTags();

        if (!filename) {
            // Occasionally, IB will strip out everything that made up the original filename.
            // In this case, we'll use the title or ID instead.
            filename = title || id;
        }

        let media: I.Media = {
            url: url,
            previewUrl: previewUrl,
            author: author,
            filename: filename,
            submissionId: id,
            extension: ext,
            type: getFileTypeByExt(ext),
            service: serviceName,
            title: title,
            description: description,
            tags: tags
        };
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        let list: I.PageLink[] = [];
        let links: HTMLAnchorElement[] = [];
        let url = new URL(window.location.href);
        let mode = url.searchParams.get('mode');
        let nosort = mode === "search" ||
            mode === "userfavs" ||
            mode === "popular" ||
            mode === "suggestions" ||
            mode === "pool" ||
            url.searchParams.get("random") === "yes" ||
            !!url.searchParams.get("orderby");

        if (isSubmissionPage()) {
            let filesArea = querySelector('#files_area');
            if (filesArea) {
                // Submissions only have submission lists if there is a files_area element somewhere,
                // in which case they are inside the element containing that element.
                // TODO: if we want to be excruciatingly correct about this, we'd also omit the link to the current submission.
                links = querySelectorAll(".widget_imageFromSubmission a", filesArea.parentElement);
            }
        }
        else {
            links = querySelectorAll(".widget_imageFromSubmission a");
        }

        list = getPageLinksFromAnchors(links, getIdFromSubmissionUrl);

        let linkList: I.PageLinkList = {
            list: list,
            sortable: !nosort,
        }
        return Promise.resolve(linkList);
    }
}

function isSubmissionPage() {
    return window.location.href.indexOf("submissionview.php") !== -1 || window.location.pathname.indexOf('/s/') === 0;
}

function getIdFromSubmissionUrl(href: string) {
    // Inkbunny submission URLs are of the format
    // https://inkbunny.net/submissionview.php?id=[ID]
    // or https://inkbunny.net/s/[ID]

    if (href.indexOf('submissionview.php') !== -1) {
        let url = new URL(href);
        return url.searchParams.get("id");
    }
    else {
        let urlParts = href.split('/');
        return urlParts.pop();
    }
}

function getPreviewImageUrl() {
    // Get the URL for the image currently on the page.
    // https://us.ib.metapix.net/files/screen/XX/[ID]_[username]_[filename].[ext]
    let image: HTMLImageElement = querySelector("#magicbox");
    if (!image) {
        // Inkbunny seems to display images in a couple of different modes, so fallback to this if
        // #magicbox doesn't exist.
        image = querySelector(".magicboxParent .widget_imageFromSubmission img");
    }
    return (image && image.src) || null;
}

function getImageUrl() {
    // Get the max preview button, if it exists
    let url: string = '';
    let button: HTMLAnchorElement = querySelector("#size_container a[target=_blank]");
    if (button) {
        // Get the url off of the button.
        // https://us.ib.metapix.net/files/full/XX/[ID]_[username]_[filename].[ext]
        url = button.href;
    }
    return url;
}

function getOriginalFilenameParts(serviceFilename: string) {
    // Expecting a string like [ID]_[username]_[filename].[ext]
    let { filename, ext } = getFilenameParts(serviceFilename);
    var filenameParts = filename.split("_");
    var id = filenameParts.shift();
    // The username part of the filename does not change if the user changes their name, so we ignore it
    var username = filenameParts.shift();
    return {
        filename: filenameParts.join("_"),
        ext: ext,
        id: id,
    }
}

function getAuthor() {
    let title = document.title;
    let slugIndex = title.lastIndexOf(' < ');
    title = title.substring(0, slugIndex);
    let byIndex = title.lastIndexOf(' by ');
    return title.substring(byIndex + 4);
}

function getTitle() {
    // Title format:
    //  "[Title] by [User] < Submission | Inkbunny..."
    let docTitle = document.title;
    return docTitle.substring(0, docTitle.lastIndexOf(" by "));
}

function getDescription() {
    let descElt = querySelector(".elephant_bottom.elephant_white .content div");
    let description = '';
    if (descElt) {
        description = descElt.textContent.trim();
    }
    return description;
}

function getTags() {
    let tags: string[] = [];
    let tagElt = querySelector("meta[name=keywords]");
    if (tagElt) {
        tags = tagElt.getAttribute('content')
            .split(',')
            .map(s => s.trim());
    }
    return tags;
}
