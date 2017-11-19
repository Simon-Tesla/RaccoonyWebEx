import { MessageAction } from './enums';
import * as I from './definitions';
import openInTabs from './openTabs';
import * as download from './download';
import * as logger from './logger';

logger.log("[background] setting up listeners");

browser.runtime.onMessage.addListener((request: I.MessageRequest<any>, sender: chrome.runtime.MessageSender, sendResponse) => {
    logger.log("[background] received request", request.action, request);
    switch (request.action) {
        case MessageAction.Test:
            browser.tabs.create({
                url: 'http://raccoony.thornvalley.com'
            }).then((tab) => {
                logger.log("[background.test] tab created", tab);
            });
            return null;
        case MessageAction.OpenTabs:
            return openInTabs(request.data);
        case MessageAction.Download:
            return download.downloadFile(request.data);
        case MessageAction.OpenFile:
            return download.openFile(request.data);
        case MessageAction.ShowFile:
            return download.showFile(request.data);
        case MessageAction.CheckDownlod:
            return download.isDownloaded(request.data);
    }
    logger.error('Invalid message received')
    return Promise.reject(new Error('Invalid message'));
});
