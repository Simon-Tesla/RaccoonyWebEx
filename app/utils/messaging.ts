import { MessageRequest, Media } from "../definitions";
import { MessageAction } from "../enums";
import * as logger from "../logger";

export function sendMessage<T>(action: MessageAction, data: T) {
    let message: MessageRequest<T> = {
        action,
        data,
    }
    logger.log("sending message", message);
    return browser.runtime.sendMessage(message);
}

export function sendDownloadMediaMessage(media: Media) {
    return sendMessage(MessageAction.Download, media);
};