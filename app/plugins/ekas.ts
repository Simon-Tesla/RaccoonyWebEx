// Eka's Portal (aryion.com)
// The gallery may have been originally based on some standard PHP
// gallery, but has been heavily modified by the site admins.
// The current (since July 2011) version is "g4", which shows up
// in the URLs.  The previous version was "g3".

// Old history: g3 went into service in March 2008.
// Gallery 2 went into service at the end of December 2005.
// As far as I can tell, neither of those are user-accessible any
// longer, so don't worry about them.

// History of this plugin:
// 0.1  2017-09-22  Initial version.
// 0.2  2017-09-27  Revised after code review.  More querySelector,
//                  less hand-parsing of HTML.
// 0.3  2017-11-24  (SimonTesla) Added Typescript typings and adapted
//                  for the new plugin API.

import * as I from '../definitions';
import { default as BaseSitePlugin, querySelector, querySelectorAll, getFileTypeByExt, getPageLinksFromAnchors, getFilenameParts } from './base';
import * as logger from '../logger';

const serviceName = "ekas";

export class EkasPlugin extends BaseSitePlugin {
    readonly siteName: string = serviceName;

    getMedia(): Promise<I.Media> {
        // Are we on a submission page?  If not, bail out.
        if (!isSubmissionPage()) {
            logger.log("ekas: not a submission page");
            return Promise.resolve(null);
        }

        //
        // URL and ID
        //

        // Submission page URL looks like
        // https://aryion.com/g4/view/[id]
        // and download link looks like
        // https://aryion.com/g4/data.php?id=[id]
        // so build the download link from current URL.
        let current = window.location.href;
        let url = current.replace("/view/", "/data.php?id=");
        logger.log("ekas: url", url);

        // Find and skip over last '='
        let idstart = url.lastIndexOf("=") + 1;
        let id = url.slice(idstart);
        logger.log("ekas: id", id);

        //
        // Title and User Name
        //

        // Title and user name are available 5 ways...
        // ...in the title tag:
        // <title>g4 :: [title] by [user]</title>
        // ...as an OpenGraph meta tag:
        // <meta property="og:title" content="[title] by [user]"/>
        // ..as a Twitter meta tag:
        // <meta name="twitter:title" content="[title] by [user]"/>
        // ...in the breadcrumb link, but note that the content
        // of this will vary, depending on how the user has set
        // up folders in their gallery:
        //  <span class='g-box-title cookiecrumb'> [...]
        // ...inside a <div class="g-box-header">, each with
        // their own span inside that (note that there's more
        // than one thing on the page with that class).

        // Let's get it from the plain old HTML title.
        // Cut off the constant 'g4 :: ' at the beginning.
        let titleuser = document.title.slice(6);
        logger.log("ekas: title-user", titleuser);

        // ' by ' might be part of a title, but hopefully
        // no users have ' by ' in their name.
        let titleend = titleuser.lastIndexOf(' by ');
        let title = titleuser.slice(0, titleend);
        logger.log("ekas: title", title);

        // Skip ' by ' and extract user
        let userstart = titleend + 4;
        let username = titleuser.slice(userstart);
        logger.log("ekas: user", username);

        //
        // Filename and Extension
        //

        // The normal download link goes to a PHP script as
        // noted under "URL and ID".  However, there are direct
        // links in two other places...
        // ...an OpenGraph meta tag:
        // <meta property="og:image:secure_url" \
        //        content="https://aryion.com/g4/data/[id]-[?].[ext]/[user]-[id]-[file].[ext]"/>
        // ...and a noscript tag with a direct <img> link, of the
        // same form:
        // https://aryion.com/g4/data/[id]-[?].[ext]/[user]-[id]-[file].[ext]
        // where [?] is a 3-digit number that I don't know the
        // source of, and [file] *might* be the original filename
        // the user provided when uploading.  Let's go for the end
        // bit, the [user]-[id]-[file].[ext] part, from the noscript
        // tag.
        let filenameext = '';
        let metaElt = querySelector("meta[property='og:secure_url']");
        if (metaElt) {
            // Try the meta tag first
            let fileUrl = metaElt.getAttribute('content') || '';
            filenameext = fileUrl.split('/').pop();
        }

        if (!filenameext) {
            // Try the noscript element next
            let noscr = document.getElementsByTagName("noscript")[0];
            let noscrtext = noscr.textContent;
            logger.log("ekas: noscript", noscrtext);

            // Kill everything after <img> closing quote, to get rid
            // of the / in the closing tag
            let endjunk = noscrtext.lastIndexOf("' alt='Item' />");
            let noscrtext2 = noscrtext.slice(0, endjunk);
            logger.log("ekas: noscript 2", noscrtext2);

            // Find last / and skip it, to get filename with extension
            let filestart = noscrtext2.lastIndexOf('/') + 1;
            filenameext = noscrtext2.slice(filestart);
        }
        logger.log("ekas: filename+ext", filenameext);

        // Last . should be where extension starts;
        // split based on where that is
        let extensionstart = filenameext.lastIndexOf('.');
        let filename = filenameext.slice(0, extensionstart);
        logger.log("ekas: filename", filename);

        let ext = filenameext.slice(extensionstart + 1);

        // In case that didn't work, punt.
        // There is a preview URL that we might be able to get an
        // extension from, but it's inside a script on the page.
        // We also get a MIME type in the user-visible metadata
        // (why?); we could also guess based on that.
        if (!ext) {
            ext = 'jpg';
        }

        logger.log("ekas: extension", ext);

        // FIXME: also handle the case of filename being blank?

        // Future use - filename without user and id in it.
        // FIXME: does this need an /i to handle capitalization
        // differences?
        let removere = new RegExp("^" + username + "-" + id + "-");
        let cleanfilename = filename.replace(removere, "");
        logger.log("ekas: clean file name", cleanfilename);


        //
        // Tags
        //

        // The tags live inside a <span class='taglist'>, and also
        // in a textarea for editing.  Both of those are inside a
        // <div class="item-detail">.  Each tag has a link in the
        // taglist.
        let metadata = document.getElementsByClassName('item-detail')[0];
        logger.log("ekas: metadata:", metadata.innerHTML);

        // Find all the links in the taglist
        let tagElements = metadata.querySelectorAll(".taglist a");

        let tags: string[] = [];

        // The plain text for each link is a tag.
        for (let ii = 0; ii < tagElements.length; ii++) {
            tags.push(tagElements[ii].textContent);
            logger.log("ekas: found tag:", tagElements[ii].textContent);
        }

        // The links for some tags also tell us whether the tag
        // refers to a user, a character, a species, a vore type,
        // etc, but we don't currently do anything with that.
        // (The site uses that to color those tags differently.)


        //
        // Description
        //

        // Lives inside otherwise unnamed <p></p> tags, insde a
        // <div class="g-box-contents">.  However, there are three
        // divs of that class - the first one with id="sized note",
        // the second one with no id (the one we want), and the
        // third one with id="comment-box".
        // Probably we should check the IDs, but just grab the
        // second one.
        let gbox = document.getElementsByClassName('g-box-contents')[1];
        logger.log("ekas: description gbox:", gbox.innerHTML);

        // The description "should" always be the very last <p> in
        // the div, so get them all and then take the last one.
        let plist = gbox.querySelectorAll("p");
        let plen = plist.length;
        let description = plist[plen - 1].textContent;
        logger.log("ekas: description:", description);

        let media: I.Media = {
            url: url,
            previewUrl: url,
            author: username,
            filename: cleanfilename,
            serviceFilename: filenameext,
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
        // FIXME: restrict this to certain URLs only?
        // /g4/messagepage.php is the main one, but there
        // are others, like /g4/gallery/[user]/ .

        // FIXME: If there are a lot of submissions from a
        // particular artist or with a particular tag, the site
        // gives you links for 8 of them, and then offers a text
        // link like "Load 17 more from [artist]" or "Load 13
        // more from [tag]".  I don't yet understand how to click
        // these links from inside here to expose more links to
        // images.  (Also, you may not want that; clicking those
        // links can give you an index page with potentially
        // *hundreds* of submissions.  If you then click "open
        // all in tabs", your swap partition is gonna get a
        // workout.)

        // Don't try to sort a favorites list.
        let current = window.location.href;
        let nosort = current.indexOf("/g4/favorites/") !== -1;

        // Build the list
        // The tags around the links to each submission look like:
        // <div class='gallery-item favorite' id='[id]'>
        //   <div>
        //     <a class='thumb' href='/g4/view/[id]'><img src='//static.aryion.com/g4/thumb/[id]-[unknown-syntax].[ext]' alt='' /></a>

        // Get the links that conform to the above tag structure.
        let links: HTMLAnchorElement[] = querySelectorAll(".gallery-item div a.thumb");
        // skip bad ones (FIXME: will this ever happen?)
        links = links.filter((link) => link.href.includes("/g4/view/"));

        let list: I.PageLink[] = getPageLinksFromAnchors(links, (href) => {
            // At this point, the href should be of the format
            // https://aryion.com/g4/view/[id] .  Get ID from end.
            let urlparts = href.split('/');
            return urlparts.pop();
        });

        let pageLinks: I.PageLinkList ={
            list: list,
            sortable: !nosort
        };

        return Promise.resolve(pageLinks);
    }
}

// Detect submission pages by page URL.
// I think /g4/view/ is the only path for individual submissions.
function isSubmissionPage() {
    return window.location.href.indexOf("/aryion.com/g4/view/") !== -1;
}