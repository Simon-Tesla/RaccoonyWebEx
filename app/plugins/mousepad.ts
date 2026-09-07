import BaseSitePlugin, { registerPlugin } from "./base";
import { Media, PageLinkList } from "../definitions";
import { querySelector, querySelectorAll, getPageLinksFromSelector } from "../utils/dom";
import { getFilenameParts } from "../utils/file";

const serviceName = 'mousepad'

export class MousepadPlugin extends BaseSitePlugin {
  constructor() {
    super(serviceName)
  }

  async getMedia(): Promise<Media> {
    // Mousepad is so easy to parse, this code is basically self-documenting.
    // Seriously, the only way this would be more straightforward is if Kammy just stuck a JSON blob in the exact format I needed on the page.
    const downloadLink = querySelector<HTMLAnchorElement>('#download-link');    
    if (!downloadLink) { return }
    const url = downloadLink.href;
    
    const imgLink = querySelector<HTMLImageElement>('#main-submission-image');
    const previewUrl = imgLink?.src ?? url;

    const authorLink = querySelector<HTMLAnchorElement>('.artist-name a');
    const author = authorLink?.textContent.trim();

    const parsedUrl = new URL(url);
    const siteFilename = parsedUrl.pathname.split('/').pop();
    const { filename, ext: extension} = getFilenameParts(siteFilename);

    const title = querySelector<HTMLMetaElement>("[property='og:title']")?.textContent.trim();
    
    const descriptionElt = querySelector('#saved-description');
    const description = descriptionElt?.innerText.trim(); // innerText preserves linebreaks

    const submissionId = window.location.pathname.split('/').pop();

    const tagElts = querySelectorAll('#tags-list .submission-page-description-tags-tags-tag a');
    const tags = tagElts.map(t => t.textContent.trim());

    return {
      url,
      previewUrl,
      author,
      filename,
      siteFilename,
      extension,
      submissionId,
      siteName: serviceName,
      title,
      description,
      tags
    }
  }

  async getPageLinkList(): Promise<PageLinkList> {
    if (window.location.pathname.startsWith('/new-uploads')) {
      // The new uploads page has a slightly different gallery format.
      const list = getPageLinksFromSelector('.notifications-content-short-form .title a', (href) => href.split('/').pop())
      return {
        sortable: true,
        list
      }
    }

    // Everything else pretty much looks like this. This doesn't get links from profile pages or the main page, 
    // but works everywhere else (e.g. galleries, pools, search, favorites).
    const list = getPageLinksFromSelector('#gallery-content-container .title a.formattable-gallery-link');

    return {
      sortable: false,
      list 
    }
  }
}

registerPlugin(MousepadPlugin, 'mousepad.art');
