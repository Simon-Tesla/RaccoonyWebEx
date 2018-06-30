// GFX (gearfetishx.com)
//
// The site appears to run BoonEx Dolphin, which is apparently a "social
// networking site in a can" product.  So, this plugin might work with
// other sites based on Dolphin, if you adjust the references to
// gearfetishx.com to mention the other site instead.
//
// GFX is a spiritual successor to gearfetish.com, which went offline in
// 2015.  The GFX admins are all new, but many of the GFX members used
// to be on gearfetish.com .

// Changelog:
// 0.1  2018-04-01  Initial version, no joke!

import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import * as logger from '../logger';

const serviceName = "gfx";

export class GfxPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getMedia(): Promise<I.Media> {
        // Are we on a submission page?  If not, bail out.
        if (!isSubmissionPage()) {
            logger.log("gfx: not a submission page");
            return Promise.resolve(null);
        }

        //
        // URL and ID
        //

        // There is an "original" button that gives you the full-size
        // image, and a "Fave" or "Unfave" button that gives you the ID.
        // They live in a box called "Actions", like this:
        //
        // <div class="actionsContainer">
        //   <div class="actionsBlock clearfix">
        //     <div class="actionItems clearfix">
        //       <div class="actionItem actionItemEven">
        //         <button class="bx-btn bx-btn-small bx-btn-ifont"
        //                 title="Original"
        //                 class="menuLink"
        //                 onclick="window.open('https://gearfetishx.com/m/photos/get_image/original/[hash].jpg')">
        //           <i class="sys-icon download"></i>
        //           <b>Original</b>
        //         </button>
        //       </div>
        //       [another div/button structure]
        //       <div class="actionItem actionItemEven">
        //         <button class="bx-btn bx-btn-small bx-btn-ifont"
        //                 title="Fave"
        //                 class="menuLink"
        //                 onclick="getHtmlData('ajaxy_popup_result_div_[id]', 'https://gearfetishx.com/m/photos/favorite/[id]', false, 'post'); return false;">
        //           <i class="sys-icon asterisk"></i>
        //           <b>Fave</b>
        //         </button>
        //       </div>
        //
        // Get all of the buttons in this structure.
        let urlIdLinks: HTMLAnchorElement[] =
            querySelectorAll("div.actionsContainer div.actionsBlock div.actionItems div.actionItem button.bx-btn");

        // get a copy of the one with the URL
        let urlLink = urlIdLinks.filter((link) => link.title.includes("Original"));
        logger.log("gfx: first urlLink element ", urlLink[0]);

        let urlStart = urlLink[0].outerHTML.indexOf("https://gearfetishx.com/m/photos/get_image/original/");
        let urlplusjunk = urlLink[0].outerHTML.slice(urlStart);
        let urlend = urlplusjunk.indexOf("')\">");
        let url = urlplusjunk.slice(0, urlend);
        logger.log("gfx: url", url);

        // get a copy of the button for the ID
        // try Fave first
        let idLink = urlIdLinks.filter((link) => link.title.includes("Fave"));

        // if that didn't work, try Unfave
        if (idLink[0] == null) {
            idLink = urlIdLinks.filter((link) => link.title.includes("Unfave"));
        }

        let id = '';

        // one of the above two should work, but in case they didn't,
        // make sure idLink exists
        if (idLink[0] != null) {
            logger.log("gfx: first idLink element ", idLink[0]);

            let idUrlStart = idLink[0].outerHTML.indexOf("https://gearfetishx.com/m/photos/favorite/");
            let idplusjunk = idLink[0].outerHTML.slice(idUrlStart);
            let idUrlEnd = idplusjunk.indexOf("', ");
            let idurl = idplusjunk.slice(0, idUrlEnd);
            let idstart = idurl.lastIndexOf("/");
            let idend = idplusjunk.indexOf("'");

            id = idplusjunk.slice(idstart + 1, idend);
        } else {
            id = "0";
        }

        logger.log("gfx: id", id);

        //
        // Title
        //

        // Title is available in the HTML title tag:
        // <title>[title]</title>
        let title = document.title;
        logger.log("gfx: title", title);

        //
        // User
        //

        // Mostly available at the end of links.  Also available in the
        // <a> tag in this structure:
        //
        // <div class="page_column page_column_last page_column_last_width_315" id="page_column_2">
        //   <div class="page_block_container bx-def-margin-sec-leftright" id="page_block_147">
        //     <div class="disignBoxFirst bx-def-margin-top bx-def-border">
        //       <div class="boxFirstHeader bx-def-bh-margin">
        //         <div class="dbTitle">Author</div>
        //         <div class="clear_both"></div>
        //       </div>
        //       <div class="boxContent">
        //         <div class="infoMain bx-def-bc-margin">
        //           <div class="thumbnail_block  thumbnail_block_with_info" style="float:none;">
        //             <div class="thumbnail_image"
        //                  onmouseover="javascript:startUserInfoTimer([userid], this)"
        //                  onmouseout="javascript:stopUserInfoTimer([userid])">
        //               <a href="https://gearfetishx.com/[username]" title="[username]">
        let userLinks: HTMLAnchorElement[] =
            querySelectorAll("div.page_column div.page_block_container div.disignBoxFirst div.boxContent div.infoMain div.thumbnail_block div.thumb_username a");
        // skip bad ones (FIXME: will this ever happen?)
        userLinks = userLinks.filter((link) => link.href.includes("/gearfetishx.com/"));

        logger.log("gfx: filtered user links", userLinks);

        // FIXME hopefully it's the first one
        let username = userLinks[0].href.split('/').pop();
        logger.log("gfx: user", username);

        //
        // Filename and Extension
        //

        // The download link to the full-sized image, found above,
        // is really the only source of this.

        let filenameext = url.split('/').pop();
        logger.log("gfx: filename+ext", filenameext);

        if (!filenameext) {
            // If we've gotten to the point that we don't have a filename,
            // then this must not be a regular submission page.
            return Promise.resolve(null);
        }

        // Last . should be where extension starts;
        // split based on where that is
        let extensionstart = filenameext.lastIndexOf('.');
        let filename = filenameext.slice(0, extensionstart);
        logger.log("gfx: filename", filename);

        let ext = filenameext.slice(extensionstart + 1);

        // In case that didn't work, punt.
        // I *think* the extension will always be .jpeg, but I'm not
        // 100% sure on that.
        if (!ext) {
            ext = 'jpg';
        }

        logger.log("gfx: extension", ext);

        // Future use - filename without user and id in it.
        // FIXME: does this make sense here?
        let cleanfilename = filename;
        logger.log("gfx: clean file name", cleanfilename);

        //
        // Tags
        //

        // The tags are available in a couple of ways:
        //
        // ...in a plain old meta tag, as a comma-separated list:
        // <meta name="keywords" content="A Nifty Tag,atag,anothertag" />
        //
        // ...and in this structure:
        // <div class="bx-form-element bx-form-element-value bx-def-margin-top clearfix" >
        //   <div class="bx-form-caption bx-def-font-inputs-captions">Tags - Comma Separated
        //     <span class="bx-form-error">
        //       <i  class="sys-icon exclamation-circle" float_info=" "></i>
        //     </span>
        //   </div>
        //   <div class="bx-form-value clearfix">
        //   <div class="input_wrapper input_wrapper_value  clearfix" >
        //     <a href="https://gearfetishx.com/m/photos/browse/tag/A+Nifty+Tag">A Nifty Tag</a>
        //     <a href="https://gearfetishx.com/m/photos/browse/tag/atag"> atag</a>
        //     <a href="https://gearfetishx.com/m/photos/browse/tag/anothertag"> anothertag</a>
        //   </div>
        // </div>
        //
        // If the user didn't specify any tags (relatively common), then
        // the page may not contain either of these structures.
        //
        // Let's try the plain old meta tag.  Hopefully there's just one.
        let metaElt = querySelector("meta[name='keywords']");

        let tags: string[] = [];

        // Only proceed if we got an element to work with.
        if (metaElt) {
            logger.log("gfx: metadata:", metaElt);

            let tagParts = metaElt.getAttribute('content').split(",");

            for (let ii = 0; ii < tagParts.length; ii++) {
                tags.push(tagParts[ii]);
                logger.log("gfx: found tag:", tagParts[ii]);
            }
        }

        // It's OK for tags to be empty here.
        logger.log("gfx: tags:", tags);

        //
        // Description
        //

        // The description is available in a couple of ways:
        //
        // ...in a plain old meta tag, as a comma-separated list:
        // <meta name="description" content="I&apos;m great." />
        //
        // ...and in a structure like this:
        // <div class="fileDescription bx-def-margin-sec-top bx-def-font-large">I'm great.</div>
        //
        // If the user didn't specify a description (relatively common),
        // then the page may not contain either of these structures.
        //
        // Let's try the plain old meta tag.  Hopefully there's just one.
        metaElt = document.querySelector("meta[name='description']");

        let description = "";

        // Only proceed if we got an element to work with.
        if (metaElt) {
            logger.log("gfx: metadata:", metaElt[0]);

            description = metaElt.getAttribute('content');
        }

        // It's OK for description to be empty here.
        logger.log("gfx: description:", description);

        let media: I.Media = {
            url: url,
            previewUrl: url,
            author: username,
            filename: cleanfilename,
            siteFilename: filenameext,
            extension: ext,
            submissionId: id,
            siteName: serviceName,
            title: title,
            description: description,
            tags: tags
        };
        return Promise.resolve(media);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        // FIXME: restrict this to certain URLs only?
        // Lists of photos are available on the site front page at
        // /index.php (although that might be a configurable option),
        // and also available at the following:
        //
        // /m/photos/home/
        // /m/photos/browse/all
        // /m/photos/browse/top
        // /m/photos/browse/popular
        // /m/photos/browse/featured
        //
        // Note that /m/photos/albums/browse/all sort of looks like it
        // should work, but those are links to albums, not photos.
        // I am not supporting that page at this time.

        // Don't try to sort a favorites list.
        let current = window.location.href;
        let nosort = current.indexOf("/m/photos/browse/favorited/") !== -1;

        // Build the list
        //
        // The structure around the links to each photo looks like:
        //
        // <div class="boxContent">
        //   <div class="bx-def-bc-padding-thd">
        //     <div id="id[numerics]">
        //       <div class="result_block">
        //
        //         <div class="sys_file_search_unit bx_photos_search_unit" id="unit_[numerics]">
        //           <div class="sys_file_search_pic bx_photos_file_search_pic">
        //           <a class="sys_file_search_pic_link" href="https://gearfetishx.com/m/photos/view/[possibly-original-filename]">
        //             <img class="bx-img-retina" src="https://gearfetishx.com/m/photos/get_image/browse/[hash].jpg"
        //                  src-2x="https://gearfetishx.com/m/photos/get_image/browse2x/[hash]" />
        //           </a>
        //         </div>
        //         <div class="sys_file_search_info">
        //           <div class="sys_file_search_title">
        //             <a href="https://gearfetishx.com/m/photos/view/[possibly-original-filename]" title="[title]">[title]</a>
        //           </div>
        //           <div class="sys_file_search_from">
        //             <a href="https://gearfetishx.com/[username]">[username]</a>
        //           </div>
        //         </div>
        //       </div>
        //
        //       <div class="sys_file_search_unit bx_photos_search_unit" id="unit_[numerics]">
        //         <div class="sys_file_search_pic bx_photos_file_search_pic">
        //           <a class="sys_file_search_pic_link" href="https://gearfetishx.com/m/photos/view/[possibly-original-filename]">
        //             <img class="bx-img-retina" src="https://gearfetishx.com/m/photos/get_image/browse/[hash].jpg"
        //                  src-2x="https://gearfetishx.com/m/photos/get_image/browse2x/[hash].jpg" />
        //           </a>
        //         </div>
        //         <div class="sys_file_search_info">
        //           <div class="sys_file_search_title">
        //             <a href="https://gearfetishx.com/m/photos/view/[possibly-original-filename]" title="[title]">[title]</a>
        //           </div>
        //           <div class="sys_file_search_from">
        //             <a href="https://gearfetishx.com/[username]">[username]</a>
        //           </div>
        //         </div>
        //       </div>
        //
        //       and so on.

        // Get the links that conform to the above tag structure.
        let links: HTMLAnchorElement[] = querySelectorAll("div.sys_file_search_unit div.sys_file_search_pic a.sys_file_search_pic_link");

        // skip bad ones (FIXME: will this ever happen?)
        links = links.filter((link) => link.href.includes("/m/photos/view/"));
        logger.log("gfx: filtered pic links:", links);

        let list: I.PageLink[] = getPageLinksFromAnchors(links, (href) => {
            // At this point, the href should be of the format
            // https://gearfetishx.com/m/photos/view/[possibly-original-filename]
            logger.log("gfx: found link:", href);
            return href;
        });

        let pageLinks: I.PageLinkList = {
            list: list,
            sortable: !nosort
        };

        return Promise.resolve(pageLinks);
    }
}

registerPlugin(GfxPlugin, 'gearfetishx.com');

// Detect submission pages by page URL.
// I think /m/photos/view/ is the only path for individual submissions.
// (That /m/ might make you think that /photos/view/ would also work,
// but it doesn't.)
function isSubmissionPage() {
    return window.location.href.indexOf("gearfetishx.com/m/photos/view/") !== -1;
}
