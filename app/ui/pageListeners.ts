import { isContextDownloadRequest, MessageRequest, Media } from "../definitions";
import SiteActions from "./siteActions";
import * as logger from '../logger'
import { MessageAction, DownloadDestination } from "../enums";
import { sendMessage, sendDownloadMediaMessage } from "../utils/messaging";

export function initPageListeners(actions: SiteActions, onContextDownloadRequest?: (media: Media) => void) {
    onContextDownloadRequest = onContextDownloadRequest || sendDownloadMediaMessage;
    
    browser.runtime.onMessage.addListener(async (request: MessageRequest<any>, sender: browser.runtime.MessageSender) => {
        if (isContextDownloadRequest(request)) {
            if (actions) {
                const { srcUrl, mediaType } = request.data;
                let media = await actions.getMediaForSrcUrl(srcUrl, mediaType);
                logger.log('got media', media);
                onContextDownloadRequest(media);
            }
            return null;
        }
        else if (request.action === MessageAction.PageContentScriptPresent) {
            return { loaded: true };
        }
    });
}

