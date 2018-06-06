import { MessageRequest, QueryMediaResponse, QueryMediaRequest, isQueryMediaRequest } from "./definitions";
import { MessageAction } from "./enums";
import SiteActions from "./ui/siteActions";
import { getSitePlugin } from "./plugins";
import * as logger from './logger'

browser.runtime.onMessage.addListener((request: MessageRequest<any>, sender: browser.runtime.MessageSender) => {
    if (isQueryMediaRequest(request)) {
        const { srcUrl } = request.data;
        const sitePlugin = getSitePlugin(window.location.hostname);
        if (sitePlugin) {
            logger.log('loaded site plugin', sitePlugin.siteName);
            const actions = new SiteActions(sitePlugin);

            return actions.getMediaForSrcUrl(srcUrl)
                .then(media => ({ media } as QueryMediaResponse));
        }
        return Promise.resolve(null);
    }
});