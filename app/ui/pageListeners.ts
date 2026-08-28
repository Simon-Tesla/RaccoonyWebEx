import { isContextDownloadRequest, MessageRequest, Media, ContextDownloadRequest } from "../definitions";
import SiteActions from "./siteActions";
import * as logger from '../logger'
import { MessageAction } from "../enums";
import { sendDownloadMediaMessage } from "../utils/messaging";

export function initPageListeners(actions: SiteActions | undefined, onContextDownloadRequest?: (media: Media) => void) {
    onContextDownloadRequest = onContextDownloadRequest || sendDownloadMediaMessage;
    
    browser.runtime.onMessage.addListener(async (req, _sender) => {
        const request: ContextDownloadRequest | MessageRequest<unknown> = req;
        if (isContextDownloadRequest(request)) {
            if (actions && request.data) {
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

