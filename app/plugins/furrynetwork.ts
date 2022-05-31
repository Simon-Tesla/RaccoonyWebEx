import * as I from '../definitions';
import { default as BaseSitePlugin, registerPlugin } from './base';
import { querySelectorAll, querySelector, getPageLinksFromAnchors } from '../utils/dom';
import * as logger from '../logger';

const serviceName = "furrynetwork";

export class FurryNetworkPlugin extends BaseSitePlugin {
    constructor() {
        super(serviceName, "#app");
    }

    getMedia(): Promise<I.Media> {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                try {
                    // Get the max preview button, if it exists
                    let button: HTMLAnchorElement = querySelector(".submission-actions a[target=_blank]");
                    if (!button) {
                        // Can't proceed without the download URL.
                        resolve(null);
                        return;
                    }
                    let url = button.href;
                    logger.log("fn: url ", url);

                    // siteFilename, author, extension
                    // FN download URLs look like so:
                    // https://furrynetwork-beta.s3.amazonaws.com/[us]/[username]/submission/[year]/[month]/[hexstring].[ext]
                    let urlParts = url.split("/");
                    let dlFilename = urlParts.pop();
                    urlParts.pop() // month
                    urlParts.pop() // year
                    urlParts.pop() // submission
                    let username = urlParts.pop();
                    let extIndex = dlFilename.lastIndexOf(".");
                    let ext = dlFilename.substring(extIndex + 1);

                    // submissionId
                    // Individual submissions on FN have URLs look like so:
                    // https://furrynetwork.com/artwork/[id]/[title]/
                    //
                    // However, if you got to the submission from a browse
                    // or search page, the URL can look like one of these:
                    // https://furrynetwork.com/artwork/popular/?page=1&time=lastWeek&viewId=[id]&viewType=artwork
                    // https://furrynetwork.com/artwork/popular/?page=1&tags[]=dragon&time=lastWeek&viewId=[id]&viewType=artwork
                    //
                    // Try to parse the /artwork/[id]/ style first...
                    let pagePath = window.location.pathname.split("/");
                    let id = pagePath[2];
                    logger.log("fn: id", id);

                    // ...but if id is non-numeric, then try the
                    // &viewId=[id] style.
                    if(isNaN(Number(id))) {
                      logger.log("fn: id is non-numeric, looking for viewId= parameter");
                      let parameters = window.location.href.split("&");
                      logger.log("fn: parameters", parameters);
                      for(let parameter of parameters) {
                        if(parameter.indexOf("viewId=") > -1) {
                          logger.log("fn: found parameter", parameter);
                          let id_pieces = parameter.split("=");
                          id = id_pieces[1];
                        }
                      }
                    }
                    logger.log("fn: id", id);

                    // previewUrl
                    let previewImg: HTMLImageElement = querySelector('.submission__image img');
                    let previewUrl = (previewImg && previewImg.src) || null;

                    // title and filename
                    let titleElt = querySelector('.submission-description__title');
                    let title = titleElt && titleElt.textContent.trim();
                    let filename = title;

                    // description
                    let descriptionElt = querySelector(".submission-description__description__md");
                    let description = (descriptionElt && descriptionElt.textContent.trim()) || '';

                    // tags
                    let tags = querySelectorAll(".tag__label")
                        .map((el) => el.textContent.trim());

                    let media: I.Media = {
                        url: url,
                        previewUrl: url,
                        author: username,
                        siteFilename: dlFilename,
                        filename: filename,
                        extension: ext,
                        submissionId: id,
                        siteName: serviceName,
                        title: title,
                        description: description,
                        tags: tags
                    };

                    resolve(media);
                } catch (e) {
                    logger.error(serviceName, e.message, e);
                    reject(e);
                }
            }, 500);
        });
    }

    // FurryNetwork has ajax paging, so we're not going to support lists for now.
    // TODO: could try to look for links on the page that are visible but haven't been opened?
    // Would need an code to filter out visited pages.
    //getPageLinkList(): Promise<I.PageLinkList> {
    //    let list: I.PageLink[] = [];
    //    return Promise.resolve({
    //        list: list,
    //        sortable: false
    //    });
    //}
}

registerPlugin(FurryNetworkPlugin, 'furrynetwork.com');
