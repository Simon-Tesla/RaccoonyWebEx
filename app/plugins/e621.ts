import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import * as logger from '../logger';

// e621 redesigned their site on about 2020-03-05, and added "lore" tags
// on 2020-03-19.  This plugin was modified heavily in late 2020-03 to
// match the new design and handle the new tag type.

// Note: This plugin does not provide an isSubmissionPage() function.
// It gets run on every page on e621 that the user might visit.
// The main part of Raccoony calls getMedia() first.  If it's a search-
// results page, with multiple images, the tests early in getMedia() for
// the URL of the image will fail.  If it's an individual submission,
// getMedia() will be able to parse it.
// Then, the main part calls getPageLinkList().  If it's a search-results
// page, getPageLinkList() will be able to parse it.  If it's an individual
// submission, getPageLinkList() will find no links.

const serviceName = "e621";

export class E621Plugin extends BaseSitePlugin {
    constructor() {
        super(serviceName);
    }

    getMedia(): Promise<I.Media> {
        // Look for the "download" link first
        let downloadLink = querySelector('#image-download-link a');
        let url = downloadLink && downloadLink.getAttribute("href");
        logger.log("e621: first try url", url);

        if (!url) {
            // If that didn't work, look for the image itself
            let image = document.getElementById("image");
            logger.log("e621: second try image", image);

            // Get the URL from the image
            url = image && image.getAttribute("src");
            logger.log("e621: second try url", url);
        }

        if (!url) {
            // Couldn't find anything, bail out.
            return Promise.resolve(null);
        }

        // Get the artist's name
        // If the name is known to e621, it is available in two meta tags in
        // the <head>, which can have a couple of different formats:
        //
        // <meta name="og:title"      content="[subject] created by [artist] - e621">
        // <meta name="twitter:title" content="[subject] created by [artist] - e621">
        // (example, sfw: 1605283 )
        //
        // <meta name="og:title"      content="created by [artist] - e621">
        // <meta name="twitter:title" content="created by [artist] - e621">
        // (example, nsfw: 1459690 )
        //
        // It's not clear how e621 picks [subject].  It *might* be generated
        // based on the "character" tags, if available, but it might be
        // something else.  It's also not clear why some images don't have
        // a [subject] in this tag, even if they are otherwise well-tagged.
        // It *might* have something to do with the submission having a tag
        // on the default blacklist, but it might not.
        //
        // Before about early 8/2021, the fixed text in all four tags above
        // was "drawn by" instead of "created by".
        //
        // If the name is not known, those meta tags still exist, but look
        // different:
        //
        // <meta name="og:title"      content="#[post-id] - e621">
        // <meta name="twitter:title" content="#[post-id] - e621">
        // (example, nsfw: 1648500 )
        let username = "unknown artist";
        let usernameElt = querySelector('meta[property="og:title"]');
        logger.log("e621: username element", usernameElt);

        // If "created by " doesn't appear in the HTML meta tag, skip parsing
        // and leave it as "unknown artist".  That way, posts with the
        // "unknown artist" e621 tag, *and* posts with no e621 artist tag at
        // all, *both* end up in the "unknown_artist" folder if downloaded.
        if(usernameElt && usernameElt.getAttribute('content').includes("created by ")) {
            let usernameplusjunk = usernameElt.getAttribute('content');
            logger.log("e621: username content", usernameplusjunk);

            let usernameStart = usernameplusjunk.lastIndexOf("created by ") + 11;
            let usernameEnd   = usernameplusjunk.lastIndexOf(" - e621");
            logger.log("e621: name start and end", usernameStart, usernameEnd);

            username = usernameplusjunk.substring(usernameStart, usernameEnd);
        }
        logger.log("e621: username", username);

        // Get the submission ID
        // e621 submission pages are of the format:
        // https://e621.net/posts/[id]?q=[query]
        // ?q=[query] is optional.  It's apparently OK to leave it on the
        // string that we pass to the main part of Raccoony.
        let pathParts = window.location.pathname.split('/');
        let id = pathParts[2];
        logger.log("e621: id", id);

        // Get the description
        let descriptionElt = querySelector(".original-artist-commentary");
        let description = (descriptionElt && descriptionElt.textContent) || '';
        description = description.trim();
        logger.log("e621: desc", description);

        // Get the tags.
        // Get the artist tags and the everything-else tags separately,
        // because we use the everything-else tags to build the filename
        // later on.
        let artistTags: string[] = querySelectorAll(".artist-tag-list a[href^='/posts?tags='].search-tag")
            .map((el) => el.textContent.trim());
        logger.log("e621: cooked artist tags", artistTags);

        let allOtherTags: string[] = querySelectorAll("ul:not(.artist-tag-list) a.search-tag")
            .map((el) => el.textContent.trim());
        logger.log("e621: cooked not-artist tags", allOtherTags);

        let tags = artistTags.concat(allOtherTags);
        logger.log("e621: combined tags", tags);

        // If you just want all the tags at once, regardless of type:
        // let tags = querySelectorAll("a.search-tag");
        //
        // If you wanted to enumerate all the tag types and select them
        // that way, this would work with the seven known tag types (as
        // of late March, 2020):
        // let tagSelector =
        //     ".artist-tag-list    a[href^='/posts?tags='].search-tag, " +
        //     ".copyright-tag-list a[href^='/posts?tags='].search-tag, " +
        //     ".species-tag-list   a[href^='/posts?tags='].search-tag, " +
        //     ".character-tag-list a[href^='/posts?tags='].search-tag, " +
        //     ".general-tag-list   a[href^='/posts?tags='].search-tag, " +
        //     ".meta-tag-list      a[href^='/posts?tags='].search-tag, " +
        //     ".lore-tag-list      a[href^='/posts?tags='].search-tag"
        //  let tags = querySelectorAll(tagSelector);

        // Get serviceFilename and ext from the URL
        // e621 image URLs are of the format
        // https://static1.e621.net/data/99/c5/99c5a9f2195e8025df8e03acef6e2b2f.png
        let serviceFilename = url.split('/').pop();
        logger.log("e621: serviceFilename", serviceFilename);
        let extIndex = url.lastIndexOf(".");
        let ext = url.substring(extIndex + 1);
        logger.log("e621: extIndex, ext", extIndex, ext);

        // Hash filenames are not too useful to users, so compose a filename
        // using the first three non-artist tags.  Since we (may) already
        // know the artist, skipping it here helps avoid redundancy in the
        // generated file names - we get something like
        // 12345_mouse_rodent_glowing_by_simon.jpg instead of
        // 12345_simon_mouse_rodent_by_simon.jpg .
        let filename = allOtherTags.slice(0, 3).join("_");
        logger.log("e621: filename", filename);

        // TODO: We might get a better idea of the original filename by
        // looking for the "source" link(s) on e621 (which link to FA,
        // Weasyl, etc), but then we have to parse the link formats for N
        // different sites in here.

        // If this submission was found via a search on e621, e621 included
        // the search terms in the link to it, like
        // http://e621.net/posts/12345?q=rodent+mouse .  Remove the search
        // terms from the URL we provide to the rest of Raccoony.
        //
        // Note: As of 2020-03, the e621 plugin is the only one that
        // overrides I.Media.sourceUrl in this way.  All of the other
        // plugins allow getMedia() in siteActions.ts to use its default
        // of window.location.href.
        let sourceUrlParts = window.location.href.split('?');
        let srcUrl = sourceUrlParts[0];
        logger.log("e621: srcUrl", srcUrl);

        // Title is not supported - e621 doesn't seem to have a place for a
        // submitter to provide one, even if they wanted to.  Set it to null.

        let media: I.Media = {
            url: url,
            previewUrl: url,
            author: username,
            siteFilename: serviceFilename,
            filename: filename,
            extension: ext,
            submissionId: id,
            siteName: serviceName,
            title: null,
            description: description,
            tags: tags,
            sourceUrl: srcUrl
        };

        return Promise.resolve(media);
    }

    getPageLinkList(): Promise<I.PageLinkList> {
        // Links will be of the format
        // https://e621.net/posts/[id]?q=[query]

        // e621 supports blacklisting certain tags.  A few tags are on
        // the default blacklist, and users can add more if they want.
        // Detect blacklisted submissions and avoid adding them to the
        // list of links on this page.

        // The class for each individual submission starts out *without*
        // "blacklisted" in it.  Once e621's blacklist script runs,
        // submissions that have been blacklisted will have "blacklisted"
        // in their class.

        // The mutation selector on body means that we will get called
        // repeatedly, so eventually we will be called after the
        // blacklist script has run.

        // Check for submissions that aren't marked as blacklisted.
        let links: HTMLAnchorElement[] = querySelectorAll(".posts-container article:not(.blacklisted) a") as HTMLAnchorElement[];
        logger.log("e621: number of links found ", links.length);

        // links should now contain the list of submissions we want.
        // It's possible for links to be length 0 here, if *everything*
        // on the page is blacklisted.
        logger.log("e621: raw links", links);

        // Pass the list of URLs, plus the submission IDs.
        // Note that the URLs are fully-qualified here, and not relative.
        let list = getPageLinksFromAnchors(links, href => {
                let urlparts = href.split('/');
                return urlparts.pop();
            }
        );
        logger.log("e621: cooked links", list);

        let res: I.PageLinkList = {
            list: list,
            sortable: false,
        }
        return Promise.resolve(res);
    }
}

registerPlugin(E621Plugin, 'e621.net');
registerPlugin(E621Plugin, 'e926.net');