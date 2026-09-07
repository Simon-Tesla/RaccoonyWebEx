import BaseSitePlugin, { registerPlugin } from "./base";
import { Media } from "../definitions";
import { querySelector, querySelectorAll } from "../utils/dom";
import { getFilenameParts } from "../utils/file";

const serviceName = 'mousepad'

export class MousepadPlugin extends BaseSitePlugin {
  constructor() {
    super(serviceName)
  }

  async getMedia(): Promise<Media> {
    // Mousepad is so easy to parse, this code is basically self-documenting.
    const downloadLink = querySelector<HTMLAnchorElement>('#download-link');    
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
}

registerPlugin(MousepadPlugin, 'mousepad.art');
