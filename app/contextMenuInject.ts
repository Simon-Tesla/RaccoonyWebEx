import { MessageRequest, QueryMediaResponse, QueryMediaRequest, isQueryMediaRequest } from "./definitions";
import { MessageAction } from "./enums";
import SiteActions from "./ui/siteActions";
import { getSitePlugin } from "./plugins";
import * as logger from './logger'

browser.runtime.onMessage.addListener((request: MessageRequest<any>, sender: browser.runtime.MessageSender) => {
    if (isQueryMediaRequest(request)) {
        const { srcUrl, mediaType } = request.data;
        const sitePlugin = getSitePlugin(window.location.hostname);
        if (sitePlugin) {
            const actions = new SiteActions(sitePlugin);

            return actions.getMediaForSrcUrl(srcUrl, mediaType)
                .then(media => {
                    logger.log('got media', media);
                    return { media } as QueryMediaResponse
                });
        }
        return Promise.resolve(null);
    }
    else if (request.action === MessageAction.PageContentScriptPresent) {
        return Promise.resolve({ loaded: true });
    }
});