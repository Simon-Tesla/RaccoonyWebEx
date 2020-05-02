// Pixiv.net
//
// Japanese artwork site.
//
// Probably available in both English and Japanese versions, and possibly
// other languages.  This plugin was written based on the English version.
//
// On initial page load, there is a giant meta tag in the HTML head that
// has just about everything you'd want to know, as JSON, with name
// "preload-data" and id "meta-preload-data".  However, one of the
// scripts at Pixiv takes this tag away some time after the initial page
// load.  So sigh deeply and parse things out of the HTML.
//
// Informal history of this plugin:
// 2020-04-28  Initial version.  Images only.

import * as I from '../definitions';
import * as logger from '../logger';
import { default as BaseSitePlugin, registerPlugin} from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import { getFilenameParts } from '../utils/file';

const siteName = "pixiv";
const mutationSelector = 'body';

export class PixivPlugin extends BaseSitePlugin {
    constructor() {
        super(siteName, mutationSelector);
    }

    async getMedia(): Promise<I.Media> {
        // Are we on a submission page?  If not, bail out.
        if (!isSubmissionPage()) {
            logger.log("pixiv: not a submission page");
            return null;
        }

        // It takes a while for all the scripts at Pixiv to run and
        // populate the HTML body, so bail out early if things we
        // want aren't there yet.  The mutationSelector will make it
        // so that we get called repeatedly as the scripts at Pixiv
        // mess with the HTML body; eventually we'll be able to find
        // everything we want.

        // TODO Can remove this after development.  Just here to see
        // the progress of the body loading in.
        let staticbody = document.body.innerHTML;
        logger.log("pixiv: document static body", staticbody);

        // The relevant metadata items seem to have consistent IDs in the
        // HTML, but the IDs aren't in English.
        let authorElt = document.querySelector("a.sc-oTQPx.kXDOqF");
        let author = authorElt && authorElt.textContent.trim();
        logger.log("pixiv: author elt, author", authorElt, author);

        if(!authorElt) {
            logger.log("pixiv: couldn't find author, bailing out");
            return null;
        }

        let titleElt = document.querySelector("h1.sc-khSPhy.idKHda");
        let title = titleElt && titleElt.textContent.trim();
        logger.log("pixiv: title elt, title ", titleElt, title);

        let descElt = document.querySelector("p.sc-qXOEO.flGXlc");
        let description = descElt && descElt.textContent.trim();
        logger.log("pixiv: desc elt, description ", descElt, description);

        let tags: string[] = [];
        let tagsUl = document.querySelector("ul._1LEXQ_3");

        if(tagsUl) {
            logger.log("pixiv: tag ul ", tagsUl.innerHTML);

            // Find all the links in the taglist.
            let tagElements = tagsUl.querySelectorAll("a");

            // The plain text for each link is a tag.  The link in each
            // tag may be in (at least) Japanese or English, probably
            // depending on how the artist originally tagged it.
            //
            // If the link is in Japanese, and Pixiv knows the English
            // translation of the tag, the plain text will be in English;
            // otherwise it's spelled out in romaji.  The links will have
            // kanji or katakana in them.
            // Example: https://www.pixiv.net/en/artworks/57194842 (sfw)
            //
            // If the link is in English, the plain text seems to also be
            // in English; Pixiv doesn't try to provide a translation.
            // Example: https://www.pixiv.net/en/artworks/78770109 (sfw)
            //
            // Collect the plain text and link elements as two separate
            // arrays.  If the artist tagged it in Japanese, we'll end up
            // with one array of English/romaji, and one of Japanese.
            // When we combine them later, English will be first, then
            // Japanese.  If the artist tagged it in English, we'll end
            // up with many duplicates between both arrays.  In both
            // cases, use a set to remove duplicates.

            let textTags: string[] = [];
            let linkTags: string[] = [];

            for (let ii = 0; ii < tagElements.length; ii++) {
                textTags.push(tagElements[ii].textContent.trim());

                // Get rid of the %-encoding of the Japanese characters.
                let linkTagHref = decodeURIComponent(tagElements[ii].href);
                // FIXME Hopefully the tag is always the last thing in
                // the link.
                linkTags.push(linkTagHref.split('/').pop());
            }
            logger.log("pixiv: text tags ", textTags);
            logger.log("pixiv: link tags ", linkTags);

            let tagSet = new Set();

            for (let tag of textTags) {
                tagSet.add(tag);
            }

            for (let tag of linkTags) {
                tagSet.add(tag);
            }

            for (let tag of tagSet) {
                tags.push(<string>tag);
            }
        }
        logger.log("pixiv: tags ", tags);

        // Pixiv supports several sizes of thumbnails.
        //
        // When not logged in, the main image is one of the larger
        // thumbnails, scaled to fit on the page.  There is a link
        // available to the original, full-size image, but it doesn't
        // work.
        // FIXME  When you are logged in, the link to the full-size
        // image works.

        // The available sizes, and the names Pixiv knows them by, are these
        // (spaces added for pattern recognition):
        //
        // mini      https://i.pximg.net/c/48x48         /img-master  /img/[YYYY]/[MM]/[DD]/[HH]/[MM]/[SS]/[id]_p0_square1200.jpg
        // thumb     https://i.pximg.net/c/250x250_80_a2 /img-master  /img/[YYYY]/[MM]/[DD]/[HH]/[MM]/[SS]/[id]_p0_square1200.jpg
        // small     https://i.pximg.net/c/540x540_70    /img-master  /img/[YYYY]/[MM]/[DD]/[HH]/[MM]/[SS]/[id]_p0_master1200.jpg
        // regular   https://i.pximg.net                 /img-master  /img/[YYYY]/[MM]/[DD]/[HH]/[MM]/[SS]/[id]_p0_master1200.jpg
        // original  https://i.pximg.net                 /img-original/img/[YYYY]/[MM]/[DD]/[HH]/[MM]/[SS]/[id]_p0.jpg

        // This is the full-sized image - link doesn't work unless you are
        // logged in.
        let fullsizeImgElt  = document.querySelector("a.sc-pkwNG.gpMGIu");
        let fullsizeImg = fullsizeImgElt && fullsizeImgElt.getAttribute("href");
        logger.log("pixiv: full size image ", fullsizeImg);

        // Thumbnail - always works, even if you aren't logged in.
        let thumbImgElt = document.querySelector("img.sc-oUGow.cwaZMZ");
        let thumbImg = thumbImgElt && thumbImgElt.getAttribute("src");
        logger.log("pixiv: thumbnail image ", thumbImg);

        // FIXME: For now, use the thumbnail image.  Design decision:
        // 1) Always use thumbnail.
        // 2) Try to access full-size, if no joy, then use thumbnail.
        // 3) Always use full-size, and document that you have to be
        //    logged in to Pixiv for the plugin to work.
        let url = thumbImg;
        let siteFilename = thumbImg.split('/').pop();
        let previewUrl = thumbImg;
        logger.log("pixiv: url, siteFilename, previewUrl ", url, siteFilename, previewUrl);

        // The submission ID is part of the thumbnail name.  We could
        // also get it from window.location.href, I think.
        let submissionId = siteFilename.split('_')[0];
        logger.log("pixiv: sub ID ", submissionId);

        // Use the author's title as the local filename.
        // FIXME: NLS / character set on the local filesystem?
        // Should we generate a name based on the tags, like the
        // e621 plugin?
        let filename = title;

        // Get ext from the thumbnail image link.
        // FIXME: Will fail on non-image submissions, like audio or
        // stories.
        let ext = siteFilename.split('.').pop();
        logger.log("pixiv: filename, ext ", filename, ext);

        let media: I.Media = {
            url: url,
            previewUrl: previewUrl,
            author: author,
            filename: filename,
            siteFilename: siteFilename,
            extension: ext,
            submissionId: submissionId,
            siteName: siteName,
            title: title,
            description: description,
            tags: tags
        };
        logger.log("pixiv: media ", media);
        return media;
    }

    async getPageLinkList(): Promise<I.PageLinkList> {
        // Links at Pixiv seem to come in at least two flavors:
        // Japanese:  https://www.pixiv.net/[stuff]
        // English:   https://www.pixiv.net/en/[stuff]
        // As far as possible, make the patterns not care about the
        // /en/ being there.

        // Gallery page for one artist:
        // https://www.pixiv.net/en/users/[id]/artworks
        // https://www.pixiv.net/users/[id]/artworks
        var galleryPage = new RegExp("\/users\/[0-9]{1,}\/artworks");

        // Tag search results:
        // https://www.pixiv.net/en/tags/[tag1] [tag2] [...]/
        // https://www.pixiv.net/en/tags/[tag1] [tag2] [...]/illustrations

        if ( !galleryPage.test(window.location.href)  &&
             !window.location.href.includes("/tags/")    ) {
            return null;
        }

        // FIXME TBD.  Don't sort anything for now.
        let nosort = true;

        let links: HTMLAnchorElement[] = querySelectorAll("a.sc-pAZqv.cuOtHq.sc-fzqKxP.bjVaJx");
        logger.log("pixiv: raw links ", links);

        if(!links || links.length == 0) {
            return null;
        }

        let list: I.PageLink[] = getPageLinksFromAnchors(links, (href) => {
            // Pull the ID out of the link.  Link will be like
            // /artworks/en/12345 or /artworks/12345 .
            // Hopefully the ID is always the last thing.
            return href.split('/').pop();
        });

        logger.log("pixiv: cooked links ", list);

        let res: I.PageLinkList = {
            list: list,
            sortable: !nosort
        };

        return res;
    }

}

// Detect submission pages by page URL.
// /en/artworks is the English version, /artworks is Japanese.
// FIXME: "/artworks/" may only be visual art; stories may be different.
function isSubmissionPage() {
    if( (window.location.href.indexOf("pixiv.net/en/artworks/") !== -1) ||
        (window.location.href.indexOf("pixiv.net/artworks/")    !== -1)    ) {
        return true;
    }
}

registerPlugin(PixivPlugin, 'pixiv.net');
