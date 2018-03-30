// Shorpy (shorpy.com)
//
// Shorpy has two of types of pages where submissions can be viewed.
// One of them just has the large version of the picture and a caption,
// and has a URL like http://www.shorpy.com/node/[id]?size=_original#caption .
// The other has a smaller version of the picture, comments from users,
// links to ads, etc, and has a URL like http://www.shorpy.com/node/[id] .

// History of this plugin:
// 0.1  2018-03-26  Initial version for Raccoony 1.0.1
// 0.2  2018-03-26  Modified for Raccoony 1.1.1

import * as I from '../definitions';
import {
    default as BaseSitePlugin,
    querySelector,
    querySelectorAll,
    getFileTypeByExt,
    getPageLinksFromAnchors,
    getFilenameParts
} from './base';
import * as logger from '../logger';

const serviceName = "shorpy";

export class ShorpyPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getMedia(): Promise<I.Media> {
        // Are we on a submission page?  If not, bail out.
        if (!isSubmissionPage()) {
            logger.log("shorpy: not a submission page");
            return Promise.resolve(null);
        }

        // Some parsing depends on whether we are on a full-size image
        // page or a preview page.  Test it once here so we don't have
        // to keep testing it.
        let isFullsize = window.location.href.includes("size=_original");

        //
        // ID
        //

        // Submission page URL looks like EITHER
        // http://www.shorpy.com/node/[id]?size=_original#caption
        // (full-size image page with caption only), OR
        // http://www.shorpy.com/node/[id]
        // (page with preview picture and comments).

        let current = window.location.href;
        let urlparts = current.split('/');
        let idplusjunk = urlparts.pop();
        let id = idplusjunk.replace("?size=_original#caption", "");
        logger.log("shorpy: id", id);

        //
        // URL
        //

        // The download link for a large picture can look like any of
        // http://www.shorpy.com/files/images/SHORPY-[hash].jpg
        // (recent pictures)
        // http://www.shorpy.com/files/images/SHORPY_[hash].jpg
        // (older pictures)
        // http://www.shorpy.com/files/images/[hash].jpg
        // (very old pictures)
        // http://www.shorpy.com/files/images/[arbitrary].jpg
        // (user-submitted pictures)

        // For a preview picture, it's
        // http://www.shorpy.com/files/images/SHORPY-[hash].preview.jpg
        // (recent)
        // http://www.shorpy.com/files/images/SHORPY_[hash].preview.jpg
        // (older)
        // http://www.shorpy.com/files/images/[hash].preview.jpg
        // (very old)
        // http://www.shorpy.com/files/images/[arbitrary].preview.jpg
        // (user-submitted pictures),
        // and I don't know what the hash function is.

        // On the large-picture page, the picture we want should be the
        // only <img> from shorpy.com, but on the preview-picture page,
        // the one we want is one of several <img>s.  Handle both cases.

        // FIXME: The preview pages also seem to have an accurate
        // "og:image" meta tag - maybe it would be simpler to get it
        // from there?

        // Find all the <img> tags
        let everyimg: HTMLImageElement[] = querySelectorAll("img");

        let theone = '';

        if (isFullsize) {
            // Full-size image.
            for (let img of everyimg) {
                if (img.src.includes("www.shorpy.com")) {
                    theone = img.src;
                }
            }
        }
        else {
            // Preview image.
            // For some reason, filter didn't work, so do linear search
            var patt = new RegExp("\/files\/images\/SHORPY[_-]");
            for (let img of everyimg) {
                if (patt.test(img.src)) {
                    theone = img.src;
                }
            }

            // If we didn't find anything yet, maybe this is an oldie that
            // just has the [hash].preview.jpg filename...
            if (!theone.includes("SHORPY")) {
                patt = new RegExp(".preview.jpg$");
                for (let img of everyimg) {
                    if (patt.test(img.src)) {
                        theone = img.src;
                    }
                }
            }
        }

        // FIXME: what if theone is still null here?
        // Turn preview URL into full-size URL
        let url = theone.replace(".preview.", ".");
        logger.log("shorpy: url", url);

        //
        // Title
        //

        // Title is available in the title tag.
        // Title varies, though, between full-size pages
        // <title>Shorpy Historic Picture Archive :: [title]: [year] high-resolution photo</title>
        // and preview pages
        // <title>[title]: [year] | Shorpy | #1 Old Photos</title>

        let titlewithyear = '';
        let doctitle = document.title;

        if (isFullsize) {
            // Full-size page

            // Cut off the constant text at the beginning.
            let titlewithjunk = doctitle.replace("Shorpy Historic Picture Archive :: ", "");
            logger.log("shorpy: title with junk", titlewithjunk);

            // Cut off the constant text at the end
            titlewithyear = titlewithjunk.replace(" high-resolution photo", "");
            logger.log("shorpy: title with year", titlewithyear);
        }
        else {
            // Preview page

            // Cut off the constant text at the end.
            titlewithyear = doctitle.replace(" | Shorpy | #1 Old Photos", "");
            logger.log("shorpy: title with year", titlewithyear);
        }

        // Cut off the year
        let titleend = titlewithyear.lastIndexOf(':');
        let title = titlewithyear.slice(0, titleend);
        logger.log("shorpy: title", title);

        // Save the year for later (skip leading space)
        let year = titlewithyear.slice(titleend + 2);
        logger.log("shorpy: year", year);

        //
        // Filename and Extension
        //

        // Build it from URL of this page.  I *think* the images are
        // always JPGs, but go with what the URL says.

        let pathend = url.lastIndexOf('/');
        let filenameext = url.slice(pathend + 1);
        logger.log("shorpy: filename+ext", filenameext);

        let filenameend = filenameext.lastIndexOf('.');
        let filename = filenameext.slice(0, filenameend);
        logger.log("shorpy: filename", filename);
        let ext = filenameext.slice(filenameend + 1);
        logger.log("shorpy: extension", ext);

        if (!filename || !ext) {
            // If we've gotten to the point that we don't have a filename,
            // then this must not be a regular submission page.
            return Promise.resolve(null);
        }

        //
        // Clean filename
        //

        // FIXME is there a better way to set cleanfilename?
        let cleanfilename = filenameext;

        //
        // Tags
        //

        // Tags are not available with the full-sized pictures.
        // They are only available on the page that has a smaller picture
        // and comments, with a URL like http://www.shorpy.com/node/[id] .
        // On that kind of page, they live inside a div:
        //
        // <div style="margin: 0 0 5px 0;" class="taxonomy">Tags:
        //   <ul class="links inline">
        //     <li class="first taxonomy_term_37">
        //       <a href="/shared" rel="tag" title="Reader-submitted photos." class="taxonomy_term_37">ShorpyBlog</a>
        //     </li>
        //     <li class="last taxonomy_term_36">
        //       <a href="/gallery/shared" rel="tag" title="[A really long-winded thing]" class="taxonomy_term_36">Member Gallery</a>
        //     </li>
        //   </ul>
        // </div>
        // The text of the <a> links are the tags.
        let tagdiv = document.getElementsByClassName('taxonomy')[0];

        let tags: string[] = [];

        // Only parse tags if we found the div.
        if (tagdiv) {
            logger.log("shorpy: tag div:", tagdiv.innerHTML);

            // Find all the links in the taglist
            let tagElements = tagdiv.querySelectorAll("a");

            // The plain text for each link is a tag.
            for (let ii = 0; ii < tagElements.length; ii++) {
                tags.push(tagElements[ii].textContent);
                logger.log("shorpy: found tag:", tagElements[ii].textContent);
            }
        }
        // It's OK for tags to be empty at this point, if we are on
        // a full-size picture.

        // Add year to tag
        tags.push(year);
        logger.log("shorpy: added tag for year");

        //
        // Description
        //

        // On the full-size picture, this is available in a div:
        // <div class="caption" id="caption">
        // On the preview picture with comments, probably the best place is
        // an OpenGraph meta tag:
        // <meta property="og:description" content="[text of caption]" />

        let description = '';
        // Try the meta tag first
        let metaElt = querySelector("meta[property='og:description']");
        if (metaElt) {
            description = metaElt.getAttribute('content');
            logger.log("shorpy: meta tag description:", description);
        } else {
            // If meta tag didn't work, try the div
            let wholediv = document.getElementsByClassName('caption')[0].innerHTML;

            // If Shorpy has the rights to the picture, there will be
            // a "buy print" button inside the caption div - otherwise
            // no button.  If the button is there, slice it off of the
            // beginning.
            //
            let buttonend = 0;
            if (wholediv.indexOf("BUY PRINT") != -1) {
                buttonend = wholediv.indexOf('</span></a> &nbsp;') + 18;
            }
            let descplusjunkjunk = wholediv.slice(buttonend);

            // There is always a link at the end of the caption div,
            // and before the constant 'Click image for Comments' text.
            // However, there can also be links inside the caption.
            // Look for the constant text, cut that off, and then cut
            // off the last link before that.  (Leave any other links in
            // the caption alone - it will look crummy in a metadata file,
            // but it won't lose information.)
            let clickforcomments = descplusjunkjunk.indexOf('Click image for Comments.');
            let descplusjunk = descplusjunkjunk.slice(0, clickforcomments);

            let linkstart = descplusjunk.lastIndexOf('<a href');
            description = descplusjunk.slice(0, linkstart);

            logger.log("shorpy: div description:", description);
        }

        //
        // User Name
        //
        // The photographer or original source of the image is credited
        // in various ways, usually towards the end of the caption - it's
        // not in an easily parseable tag or format.  Some examples of
        // the last sentence in the caption:
        //
        // "Photo: Russell Lee for the Farm Security Administration."
        // "These seem to be from a family in Wisconsin."
        // "8x10 inch dry plate glass negative, Detroit Publishing Company."
        // "Photo by Ezra Stoller."
        // "35mm Kodachrome by William D. Volkmer."
        // "Medium format negative by Edwin Rosskam."
        // "Acme Newspicture."
        // "Kodachrome slide by me, William D. Volkmer."
        // "5x7 glass negative by Chris Helin."

        // FIXME - maybe attempt to parse the '...by John Doe' kind?
        let username = "Shorpy";
        logger.log("shorpy: user", username);

        let media: I.Media = {
            url: url,
            previewUrl: url,
            author: username,
            filename: cleanfilename,
            siteFilename: filenameext,
            extension: ext,
            type: getFileTypeByExt(ext),
            submissionId: id,
            siteName: serviceName,
            title: title,
            description: description,
            tags: tags
        };

        return Promise.resolve(media);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        // The main page
        // http://www.shorpy.com/
        // and the history pages
        // http://www.shorpy.com/node?page=[number]
        // should be the only ones we try to run this on.

        // I don't think the site even supports a favorites list.
        // Don't try to sort a favorites list.
        let nosort = false;

        // Build the list
        // The tags around the links to each submission look like:
        // <h2 class="title"><a href="/node/[id]">[title]</a></h2>

        // Get the links that conform to the above tag structure.
        let links: HTMLAnchorElement[] = querySelectorAll("h2 a");
        // skip bad ones (FIXME: will this ever happen?)
        links = links.filter((link) => link.href.includes("/node/"));

        // If the links don't already point at the full-size image
        // pages, modify them to do so.
        // FIXME: this actually modifies the page source!
        // Maybe that's not what I want to do...
        for (let link of links) {
            if (!link.href.includes("?size=_original")) {
                link.href = link.href + "?size=_original#caption";
            }
        }

        let list: I.PageLink[] = getPageLinksFromAnchors(links, (href) => {
            // Pull the ID out of the modified links.
            let urlparts = href.split('/');
            let idplusjunk = urlparts.pop();
            let id = idplusjunk.replace("?size=_original#caption", "");
            return id;
        });

        logger.log("shorpy: url list", list);

        let pageLinks: I.PageLinkList = {
            list: list,
            sortable: !nosort
        };

        return Promise.resolve(pageLinks);
    }
}

// Detect submission pages by page URL.
// /node/[id] should be part of the path for individual submissions.
// /node?page= is a link to a history page, so don't just look for "/node".
function isSubmissionPage() {
    var patt = new RegExp("\/node\/[0-9]{1,}");
    return patt.test(window.location.href);
}