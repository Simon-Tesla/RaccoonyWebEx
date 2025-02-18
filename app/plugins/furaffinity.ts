import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromHtmlLinks } from '../utils/dom';
import { getFilenameParts } from '../utils/file';
import * as logger from '../logger';

const serviceName = "furaffinity";

enum FAUiAndType {
    Unknown = 0,
    OldImage = 1,
    OldOther = 2,
    NewAll = 3
}

// This plugin attempts to support both the "new" and "old" FA UIs.
// The "new" UI went into production on 2019-12-31; the "old" UI was in
// production before that date.  Before the new UI was in production,
// the new UI was also known as the "beta" UI.
// If you are not logged in to FA, you get the new UI.  If you are
// logged in, you can choose which UI you get in your account settings;
// the settings are named "classic" (old UI) and "modern" (new UI).

export class FuraffinityPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getMedia(): Promise<I.Media> {
        let { url, previewUrl, hasContentWarning, uiAndType } = getMediaUrls();

        if (!url) {
            // Didn't find a URL on the page, so let's give up.
            return Promise.resolve(null);
        }

        // FA download URLs vary a bit depending on the submission type
        // and UI.
        //
        // New UI, spaces added for clarity:
        // art   https://d.furaffinity.net/art/[username]/        [id1]/[id2].[username]_[origfilename].[ext]
        // music https://d.furaffinity.net/art/[username]/music/  [id1]/[id2].[username]_[origfilename].[ext]
        // story https://d.furaffinity.net/art/[username]/stories/[id1]/[id2].[username]_[origfilename].[ext]
        // flash https://d.furaffinity.net/art/[username]/        [id1]/[id2].[username]_[origfilename].[ext]
        // (Art and Flash are identical.)
        //
        // Old UI, spaces added for clarity:
        // art   https://d.furaffinity.net/         art/[username]/        [id1]/[id2].[username]_[origfilename].[ext]
        // music https://d.furaffinity.net/download/art/[username]/music/  [id1]/[id2].[username]_[origfilename].[ext]
        // story https://d.furaffinity.net/download/art/[username]/stories/[id1]/[id2].[username]_[origfilename].[ext]
        // flash https://d.furaffinity.net/download/art/[username]/        [id1]/[id2].[username]_[origfilename].[ext]
        // (Art and Flash are different.)
        //
        // The /download/ directory in the URLs from the old UI appears
        // to be kind of optional - you can get to the same file whether
        // it is in the URL or not - but it does change the browser
        // behavior somewhat.  As of mid 2021-08, trying it both ways
        // does this:
        //
        //   art (jpeg): view in browser, both ways
        //        flash: browser prompts to download, both ways
        // story (docx): browser prompts to download, both ways
        //  story (pdf): without /download/ gives in-browser PDF viewer;
        //               with /download/ makes browser prompt for download
        //  music (mp3): without /download/ gives in-browser player;
        //               with /download/ makes browser prompt for download
        //
        // For the moment, we will keep the URLs as given by the old UI,
        // and not try to strip the /download/ out of them.
        //
        // id1 and id2 can be slightly different numbers.  In limited
        // testing, I (Eupeptic) think id1 and id2 are equal if the artist
        // uploaded the submission and then never updated it.  If the
        // artist does update the sumbission, id2 stays the same, but id1
        // changes to a larger number.  I've seen id1 be as much as 475
        // and as little as 1 larger than id2.  I'm not sure if id1 can
        // be smaller than id2, but I think this is unlikely.  I have seen
        // them differ on files uploaded before the new FA UI was in
        // production, so I don't think it's related to the UI change.

        // Preview URLs look like this:
        // //t.facdn.net/[sub-ID]@400-[id1].[ext]
        // Yes, the protocol is missing.
        // They don't seem to vary by submission type.
        // The 400- can also be 100- 200- or 800- , which probably sets the
        // thumbnail size.

        // The original filename and extension are always last in the URL.
        let urlParts = url.split("/");
        let serviceFilename = decodeURIComponent(urlParts[urlParts.length - 1]);
        let { filename, ext } = getFilenameParts(serviceFilename);

        // Use the submission's ID number instead of any id numbers in the
        // download URL, as it won't change as new versions are uploaded.
        let id = getIdFromSubmissionUrl(window.location.href);

        logger.log("fa: urlParts and length ", urlParts, urlParts.length);
        let username = "";

        // The username is on the same spot for all types in the new UI
        // and artwork/images on the old UI...
        if( (uiAndType == FAUiAndType.NewAll)   ||
            (uiAndType == FAUiAndType.OldImage)    ) {
            // 0      1      2                 3   4
            // https: (null) d.furaffinity.net art [username]
            username = urlParts[4];
        }

        // ...but in a different place for everything else on the old UI.
        if(uiAndType == FAUiAndType.OldOther) {
            // 0      1      2                 3        4   5
            // https: (null) d.furaffinity.net download art [username]
            username = urlParts[5];
        }

        logger.log("fa: username ", username);

        // Strip off the ID from the filename, so that it doesn't get repeated when saved.
        filename = getOriginalFilename(filename, username);

        if (!ext) {
            // In rare cases, we don't even end up with an extension.
            // We'll use the preview image extension and default to jpg
            // if all else fails.
            // FIXME: This will fail on non-image submissions; previewUrl
            // will point to the thumbnail image, so we'll get jpg, png,
            // or gif as an extension, but we should have mp3, txt, pdf,
            // or similar.
            ext = getFilenameParts(previewUrl).ext || 'jpg';
        }

        let title = getTitle();
        let description = getDescription();
        let tags = getTags();

        if (!filename) {
            // Sometimes the image doesn't end up with a filename; in
            // this case we'll read a title from the metadata
            filename = title
        }

        const result: I.Media = {
            url: url,
            siteName: serviceName,
            submissionId: id,
            previewUrl: previewUrl,
            author: username,
            filename: filename,
            siteFilename: serviceFilename,
            extension: ext,
            title: title,
            description: description,
            tags: tags,
            hasContentWarning
        }

        return Promise.resolve(result);
    }

    async getPageLinkList(): Promise<I.PageLinkList> {
        let list: I.PageLink[] = [];
        // Don't try to sort the favorites lists.
        let pageUrl = window.location.href;
        let sortable = !(pageUrl.indexOf("/favorites/") !== -1 || pageUrl.indexOf("/search/") !== -1);

        let links: HTMLAnchorElement[] = getPageLinkElements();

        list = getPageLinksFromHtmlLinks(links, (href, elt) => {
            const blockedThumb = elt.closest('figure').querySelector('img.blocked-content');
            return {
                submissionId: getIdFromSubmissionUrl(href),
                hasContentWarning: !!blockedThumb
            }
        });

        return {
            list: list,
            sortable: sortable
        };
    }

    async hasPageLinkList(): Promise<boolean> {
        const elts = getPageLinkElements();
        return elts?.length > 0;
    }
}

registerPlugin(FuraffinityPlugin, 'furaffinity.net');

function getPageLinkElements(): HTMLAnchorElement[] {
    return querySelectorAll("figure figcaption a[href*='/view/']");
}

function getMediaUrls(): Pick<I.Media, 'url' | 'previewUrl' | 'hasContentWarning'> & {uiAndType: FAUiAndType} {
    // Get the download button, if it exists.  As of 2021-08, there are
    // three cases; check them all.  Note which case we have, because it
    // matters for later parsing elsewhere.

    let button: HTMLAnchorElement;
    let uiAndType: FAUiAndType = FAUiAndType.Unknown;

    // Old UI image
    let oldUiImage: HTMLAnchorElement = querySelector(".actions a[href^='//d.furaffinity.net/art/']");
    logger.log("fa: old UI image ", oldUiImage);

    // Old UI non-image
    let oldUiOther: HTMLAnchorElement = querySelector(".actions a[href^='//d.furaffinity.net/download/art/']");
    logger.log("fa: old UI other ", oldUiOther);

    // New UI all types
    let newUiAll:   HTMLAnchorElement = querySelector('.submission-sidebar .buttons .download a');
    logger.log("fa: new UI ", newUiAll);

    if(oldUiImage != null) {
        button = oldUiImage;
        uiAndType = FAUiAndType.OldImage;
    }

    if(oldUiOther != null) {
        button = oldUiOther;
        uiAndType = FAUiAndType.OldOther;
    }

    if(newUiAll != null) {
        button = newUiAll;
        uiAndType = FAUiAndType.NewAll;
    }
    logger.log("fa: button ", button);
    logger.log("fa: UI and file type ", uiAndType);

    let url = button && button.href;
    logger.log("fa: url ", url);

    // FIXME: This will break on Flash submissions, which don't have a
    // submissionImg.  previewUrl will end up null, so ui/siteActions.ts
    // will set it to be equal to url.
    let img = <HTMLImageElement>document.getElementById('submissionImg');
    logger.log("fa: img ", img);

    let previewUrl = img && img.getAttribute('data-preview-src');
    logger.log("fa: previewURL ", previewUrl);

    const hasContentWarning = img && img.classList.contains('blocked-content');

    if (!url && img) {
        // If all else fails, get the submission image source URL
        url = img.getAttribute('data-fullview-src') || img.src;
        if (url.indexOf('http:') !== 0 || url.indexOf('https:') !== 0) {
            // Add the protocol scheme to the URL if it's missing
            url = window.location.protocol + url;
        logger.log("fa: constructed URL ", url);
        }
    }

    return {
        url,
        previewUrl,
        hasContentWarning,
        uiAndType
    };
}

function getIdFromSubmissionUrl(url: string) {
    // FA submission URLs are of the format
    // https://www.furaffinity.net/view/[sub-ID]
    // where [sub-ID] is all-numeric.  (It's around 41 100 000 as of
    // 3/2021.)  The submission ID can optionally have a trailing slash.
    //
    // There can also optionally be a direct link to a comment on that
    // submission, like
    // https://www.furaffinity.net/view/[sub-ID]/#cid:[commentID]
    // or
    // https://www.furaffinity.net/view/[sub-ID]#cid:[commentID]
    // where [commentID] is also all-numeric.  (It's around 154 700 000
    // as of 3/2021.)
    //
    // Look for the part of the URL that is /view/[digits] .
    // Don't depend on there being a slash after the digits, because
    // there might not be.
    let match = url.match(/\/view\/(\d+)/);

    // If we found a match, return it; if not, return "unknown".
    if(match) {
        return(match[1]);
    } else {
        return("unknown");
    }
}

function getOriginalFilename(filename: string, username: string) {
    // Expecting an FA filename: [id2].[username]_[origfilename]
    let usrIndex = filename.indexOf(username);
    let idIndex = filename.indexOf('.');
    if (usrIndex !== -1) {
        return filename.substring(usrIndex + username.length + 1);
    }
    else if (idIndex !== -1) {
        return filename.substring(idIndex + 1);
    }
    return filename;
}

// FA includes the author name in the title in several of the metadata
// fields, so use one that has *just* the title.  The submission-title
// div qualifies and is present on all submission types, even though
// the div has a slightly different name on the old and new UIs.
// (For anything *except* Flash, the alt of the submissionImg also
// qualifies, but Flash submissions don't have a submissionImg.)
function getTitle(): string {
    let title = '';

    // Try it for both UIs
    let titleEltNew = querySelector("div.submission-title h2 p");
    let titleEltOld = querySelector("div.classic-submission-title h2");
    logger.log("fa: getTitle elements: ", titleEltNew, titleEltOld);

    if(titleEltNew) {
        title = titleEltNew.textContent;
    } else {
        title = titleEltOld.textContent;
    }
    logger.log("fa: getTitle title: ", title);

    return title
        ? title
        : '';
}

function getDescription(): string {
    let description = '';
    // Old UI
    let descriptionElts = querySelectorAll("#page-submission .maintable .alt1 .maintable .alt1");
    if (descriptionElts && descriptionElts.length >= 3) {
        description = descriptionElts[2].textContent;
    }
    else {
        // New UI
        let elt = querySelector('.p20') || querySelector('.submission-description')
        description = elt ? elt.textContent : '';
    }
    return description.trim();
}

function getTags(): string[] {
    // Old UI
    let tagElts = querySelectorAll("#keywords a");
    // New UI
    if (!tagElts || tagElts.length === 0) {
        tagElts = querySelectorAll(".submission-sidebar .tags-row .tags a");
    }

    return tagElts.map((el) => el.textContent.trim());
}
